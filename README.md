# organizations-content — Plateforme de contenu multi-tenant

API REST développée en **Symfony 8.0** et **PHP 8.4**

Le projet implémente une plateforme **multi-tenant** où plusieurs organisations isolées coexistent dans la même base, chacune avec ses membres (rôles), ses articles et son abonnement (avec période d'essai). L'invariant central : **aucune requête SQL ne doit pouvoir retourner des données d'une autre organisation** - protection appliquée au niveau Doctrine, pas au niveau controller.

---

## Fonctionnalités métier

- **Authentification JWT** (access + refresh, révocation par `jti`, `BlockedToken`).
- **Multi-tenant strict** : un utilisateur peut appartenir à **N organisations** avec un **rôle différent dans chacune** (Owner / Admin / Editor / Viewer). Le tenant courant est résolu via le header `X-Organization-Id`.
- **CRUD Organizations** : création (déclenche un trial 14j + Owner auto + settings par défaut via 3 subscribers synchrones), listing, mise à jour, suppression.
- **CRUD Members** : invitation par email (404 si user inconnu, 409 si déjà membre), listing, retrait -- protégé par `OrganizationVoter::MANAGE_MEMBERS`.
- **CRUD Articles** : création, listing paginé (`?page=1&limit=20`, max 100), lecture, mise à jour, suppression, **transition de statut** (`Draft → Published → Archived`, 409 si invalide).
- **Import bulk asynchrone** : `POST /api/articles/import` accepte un fichier JSON multi-articles, dispatch `ImportArticlesMessage` sur queue dédiée, **JsonStreamer** lit en streaming + batch flush 100, mémoire constante quel que soit le volume.
- **Export streaming** : `GET /api/organizations/{id}/export` retourne une `StreamedJsonResponse` qui yield org → subscription → members → articles par batch de 100, sans jamais charger toute l'org en mémoire.
- **Subscription lifecycle** : trial 14j → `Active` (paiement) ou `PastDue` (trial expiré, recouvrement possible) ou `Canceled` (final). Transitions validées par property hook + enum.
- **Commande CLI** `subscriptions:expire-trials --dry-run` : bascule les trials expirés en `PastDue`, dispatch un event qui downgrade le plan + envoie un email async.
- **Documentation OpenAPI** auto-générée (Swagger UI sur `/api/doc`).

---

## Stack technique

| Catégorie | Outils |
|---|---|
| Langage / Framework | PHP 8.4, Symfony 8.0 |
| Persistance | Doctrine ORM 3, PostgreSQL, Doctrine Migrations, **Doctrine SQL Filter** |
| Authentification | LexikJWTAuthenticationBundle, GesdinetJWTRefreshTokenBundle |
| Asynchrone | Symfony Messenger (transport Doctrine, queues séparées `async` + `imports`) |
| Streaming JSON | `symfony/json-streamer` (decoder + encoder) |
| Mapping | Symfony ObjectMapper (attributs `#[Map]`) |
| Validation | Symfony Validator (contraintes sur DTO) |
| Sérialisation | Symfony Serializer + `#[MapRequestPayload]` |
| Identifiants | `symfony/uid` — UUID v7 (`BINARY(16)`) |
| Documentation API | NelmioApiDocBundle (Swagger UI + spec OpenAPI 3.0) |
| Tests | PHPUnit 13 (unit testing) |
| Outils | Maker Bundle, Symfony Flex, Docker Compose (Postgres) |

---

## Concepts et notions mis en œuvre

### Architecture multi-tenant : Doctrine SQL Filter

**LE point structurant** de ce projet. Plutôt que filtrer manuellement `->where('organization = :org')` dans chaque repository (fragile : un oubli = fuite de données entre tenants), un **`OrganizationFilter`** (Doctrine SQL Filter) injecte automatiquement `WHERE organization_id = :currentOrgId` sur toute entité implémentant `App\Doctrine\TenantScoped`.

```php
// src/Doctrine/Filter/OrganizationFilter.php
public function addFilterConstraint(ClassMetadata $targetEntity, string $alias): string
{
    if (!$targetEntity->reflClass->implementsInterface(TenantScoped::class)) {
        return '';
    }
    return sprintf('%s.organization_id = %s', $alias, $this->getParameter('organization_id'));
}
```

Conséquences :

- **Oubli impossible** : la sécurité est au niveau SQL, pas au niveau application. Une nouvelle entité tenant-scoped n'a qu'à implémenter `TenantScoped` pour hériter automatiquement de la protection.
- **404 et pas 403** sur ressources d'une autre org : la ligne n'est même pas chargée par Doctrine, donc le `#[MapEntity]` du Voter renvoie `null` → 404. Cohérent : 403 trahirait l'existence de la ressource.
- **Activation par requête** : un `OrganizationContextListener` (priorité haute, après firewall) lit `X-Organization-Id`, vérifie que le user est membre, stocke l'org dans un service `OrganizationContext` scopé requête, et active le filtre avec l'UUID. **Ceinture + bretelles** : Voters double-checkent sur les opérations sensibles.

### JsonStreamer (PHP 8.4 / Symfony 8)

Utilisé dans **deux contextes opposés** pour valider la maîtrise du composant :

- **Decode (import)** — `ImportArticlesHandler` parcourt un fichier JSON multi-articles via `JsonStreamReader::read()` typé (`Type::list(Type::object(ImportedArticleInput::class))`), avec **batch flush + clear** toutes les 100 entrées et **re-fetch des entités utiles après `clear()`** (sinon entités détachées). Mémoire plate sur 100k articles.
- **Encode (export)** — `OrganizationExportController` retourne une `StreamedJsonResponse` qui yield org → subscription → members → articles via générateurs PHP, paginés par batch de 100. Pas de `json_encode` géant en mémoire, pas de timeout sur les grosses orgs.

**Antipatterns Messenger** explicitement évités : on passe les **IDs** dans les messages (`Uuid $organizationId`, `Uuid $authorMemberId`), jamais les entités (qui seraient désérialisées détachées par le worker).

### Property Hooks (PHP 8.4) — gardiens des invariants métier

Utilisés directement dans l'entité comme **point unique de vérité** des règles de transition / des propriétés calculées :

```php
// src/Entity/Subscription.php
public SubscriptionStatus $status = SubscriptionStatus::Trialing {
    set(SubscriptionStatus $next) {
        if (isset($this->status) && !$this->status->canTransitionTo($next)) {
            throw new \DomainException(sprintf(
                'Transition invalide : %s → %s',
                $this->status->value,
                $next->value,
            ));
        }
        $this->status = $next;
        if ($next === SubscriptionStatus::Active) {
            $this->currentPeriodEndsAt = new \DateTimeImmutable('+30 days');
        }
    }
}

public bool $isInTrial {
    get => $this->status === SubscriptionStatus::Trialing
        && $this->trialEndsAt > new \DateTimeImmutable();
}
```

- Setter hook : transition contrôlée + **side-effect cohérent** (ici : poser `currentPeriodEndsAt` sur transition vers `Active`). Le reste du code ne peut plus oublier ce side-effect.
- Getter hook : propriété calculée **non mappée** Doctrine (`$isInTrial` est dérivé de `status` et `trialEndsAt`).
- Pattern reproduit sur `Article::$status` (transition + dispatch event délégué au controller) et `Article::$title` (génère un slug auto via `AsciiSlugger` si vide, préserve un slug custom).

### Backed Enums avec méthodes — règles métier centralisées

Quatre enums riches, chacun avec sa logique :

| Enum | Méthodes | Rôle |
|---|---|---|
| `MemberRole` | `canView()`, `canPublish()`, `canEditOrganization()`, `canManageMembers()`, `canManageBilling()`, `canDeleteArticles()`, `canDeleteOrganization()` | Matrice de permissions, déléguée par les Voters |
| `ArticleStatus` | `canTransitionTo()`, `label()` | Automate `Draft → Published → Archived` |
| `SubscriptionStatus` | `canTransitionTo()`, `label()` | Automate `Trialing → Active/PastDue/Canceled`, `PastDue → Active` (recouvrement) |
| `PlanTier` | `maxArticles()`, `maxMembers()`, `canExport()` | Limites par plan tarifaire |

**Pattern Voter → Enum** : les Voters ne contiennent **aucun** `if/else` de permission. Ils délèguent à l'enum :

```php
return match ($attribute) {
    self::EDIT => $role->canEditOrganization(),
    self::EXPORT => $role->canEditOrganization() && ($subscription?->getPlan()->canExport() ?? false),
    self::DELETE => $role->canDeleteOrganization(),
    // ...
};
```

Zéro duplication, matrice de permissions modifiable en un seul endroit.

### Events vs Messenger — distinction explicite

L'architecture distingue clairement **les deux mécanismes**, et chaque action structurante choisit l'un ou l'autre selon la règle :

> **Event synchrone** = doit s'exécuter dans la même transaction (si ça rate, on rollback).
> **Messenger async** = tolère la latence et l'échec temporaire.

| Event | Subscribers | Type |
|---|---|---|
| `OrganizationCreatedEvent` | `AddCreatorAsOwnerSubscriber`, `CreateDefaultSubscriptionSubscriber` (trial 14j), `SeedDefaultSettingsSubscriber` | Synchrones — si l'un échoue, on rollback la création de l'org |
| `MemberInvitedEvent` | `SendInvitationEmailSubscriber` (dispatch Messenger), `AuditLogSubscriber` | Mixte — l'email est différé, le log est sync |
| `SubscriptionExpiredEvent` | `DowngradeOrganizationSubscriber` (sync, plan=Free), `SendExpiryEmailSubscriber` (dispatch Messenger) | Mixte |

**Règle d'équipe adoptée** : subscribers qui **persistent** → `dispatch` **avant** flush (même transaction) ; subscribers qui **loggent / notifient / dispatchent Messenger** → `dispatch` **après** flush (l'effet ne dépend pas de la transaction réussie).

### Subscription lifecycle (Étape 12)

Démontre l'orchestration complète : enum + property hook + repository + commande CLI + event + subscribers.

```bash
# Cron quotidien — bascule les trials expirés en PastDue
php bin/console subscriptions:expire-trials

# Mode safe : log ce qui serait fait, ne persiste rien
php bin/console subscriptions:expire-trials --dry-run
```

Le `--dry-run` est exposé via `#[Option]` (Symfony 8) directement sur le paramètre `bool $dryRun` du `__invoke` — pas de configuration manuelle du Console Input, le nom est dérivé en kebab-case automatiquement.

### Symfony ObjectMapper — DTO ↔ Entity sans boilerplate

Mapping déclaratif via attributs `#[Map]` sur les DTO, avec transformeurs pour les types complexes (dates, UUID, enums) :

```php
$org = $objectMapper->map($input, Organization::class);
return $this->json($objectMapper->map($org, OrganizationView::class), 201);
```

Les DTO Update utilisent `#[Map(if: 'isNotNull')]` pour un comportement PATCH-friendly : seuls les champs réellement passés sont écrasés.

### `#[AsCommand]` invocable + `#[Option]` Symfony 8

Pas d'héritage, juste un `__invoke`. Le `--dry-run` est dérivé automatiquement du nom du paramètre :

```php
#[AsCommand(name: 'subscriptions:expire-trials', description: '...')]
final class ExpireTrialSubscriptionsCommand
{
    public function __invoke(
        SymfonyStyle $io,
        #[Option(description: '...')]
        bool $dryRun = false,
    ): int { /* ... */ }
}
```

### UUID v7 partout

- `BINARY(16)` (compact, indexable, pas `VARCHAR(36)`).
- **Ordonnés par timestamp** → insertions séquentielles, pas de fragmentation d'index B-Tree.
- En multi-tenant, particulièrement pertinent : un UUID exposé ne révèle ni le nombre d'organisations, ni leur ordre de création (anti-IDOR par énumération).

### Documentation API auto-générée

- **Swagger UI** sur [`/api/doc`](http://localhost:8000/api/doc), spec brute sur `/api/doc.json`.
- **JWT Bearer** en sécurité globale → bouton "Authorize" fonctionnel.
- **Header `X-Organization-Id`** documenté comme parameter réutilisable (`#/components/parameters/OrganizationIdHeader`) et appliqué via `#[OA\Parameter(ref: ...)]` au niveau classe sur les controllers concernés. Le multi-tenant est ainsi visible dans le contrat OpenAPI.
- Endpoints d'auth (`/api/login`, `/api/token/refresh`) annotés en YAML (firewall, pas de controller à introspecter).

---

## Arborescence

```
src/
├── Command/
│   ├── ExpireTrialSubscriptionsCommand.php  (#[AsCommand] + #[Option] --dry-run)
│   └── CleanupBlockedTokensCommand.php      (purge des tokens JWT révoqués)
├── Context/
│   └── OrganizationContext.php              (service scopé requête, ResetInterface)
├── Controller/
│   ├── ArticleController.php                (CRUD + transition de statut)
│   ├── ArticleImportController.php          (POST /import → dispatch async)
│   ├── MemberController.php                 (invite, list, remove)
│   ├── OrganizationController.php           (CRUD)
│   └── OrganizationExportController.php     (StreamedJsonResponse)
├── Doctrine/
│   ├── Filter/OrganizationFilter.php        (SQL Filter — invariant central)
│   └── TenantScoped.php                     (marker interface)
├── Dto/
│   ├── Input/                               Create/Update Inputs validés (#[Assert\*])
│   ├── Output/                              View DTO — contrôle de l'exposition
│   └── Streaming/ImportedArticleInput.php   (#[JsonStreamable])
├── Entity/
│   ├── Organization.php  (tenant racine)
│   ├── Member.php        (pivot User ↔ Organization, role)
│   ├── Article.php       (TenantScoped, hooks $title/$status)
│   ├── Subscription.php  (TenantScoped, hooks $status/$isInTrial)
│   └── User.php          (entité globale d'authentification)
├── Enum/                 MemberRole, ArticleStatus, PlanTier, SubscriptionStatus
├── Event/                OrganizationCreated, MemberInvited, ArticlePublished, SubscriptionExpired
├── EventListener/
│   └── OrganizationContextListener.php      (résout le tenant + active le filtre)
├── EventSubscriber/      8 subscribers — sync (persist/log) ou async (dispatch Messenger)
├── Message/              ImportArticles, SendInvitationEmail, SendExpiryEmail
├── MessageHandler/       JsonStreamer batch flush, log + TODO Mailer
├── Repository/           Méthodes métier (findByUser, findExpiringTrials, …)
└── Security/Voter/       OrganizationVoter (7 attributes), ArticleVoter, SubscriptionVoter
```

---

## Endpoints principaux

| Méthode | URL | Description | Auth |
|---|---|---|---|
| POST | `/api/login` | Login → access + refresh token | Public |
| POST | `/api/token/refresh` | Rotation du refresh token | Public |
| GET / POST | `/api/organizations` | Liste mine / création | JWT |
| GET / PATCH / DELETE | `/api/organizations/{id}` | Lire / modifier / supprimer | JWT + Voter |
| GET | `/api/organizations/{id}/export` | Export streamé JSON (org + members + articles) | JWT + Voter (Pro+ requis) |
| GET / POST | `/api/organizations/{id}/members` | Listing / invitation | JWT + Voter |
| DELETE | `/api/organizations/{id}/members/{memberId}` | Retirer un membre | JWT + Voter |
| GET / POST | `/api/articles` | Listing paginé / création | JWT + `X-Organization-Id` |
| GET / PATCH / DELETE | `/api/articles/{id}` | CRUD | JWT + `X-Organization-Id` + Voter |
| PATCH | `/api/articles/{id}/status` | Transition (409 si invalide) | JWT + Voter |
| POST | `/api/articles/import` | Upload + import bulk async | JWT + Voter |
| GET | `/api/doc` | Swagger UI | Public |

**Header `X-Organization-Id` requis** sur tous les endpoints `/api/articles/*` (résolution du tenant via `OrganizationContextListener`, vérif membership, activation du filtre Doctrine).

---

## Lancer le projet

```bash
# Dépendances
composer install

# Base de données (PostgreSQL via Docker)
docker compose up -d
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# Clés JWT
php bin/console lexik:jwt:generate-keypair

# Serveur
symfony server:start

# Worker Messenger (terminaux dédiés — un par queue pour isoler les imports)
php bin/console messenger:consume async -vv
php bin/console messenger:consume imports -vv
```

---

## Commandes CLI fournies

```bash
# Bascule les Subscriptions Trialing dont le trialEndsAt est passé en PastDue,
# dispatch SubscriptionExpiredEvent (downgrade plan + email async).
php bin/console subscriptions:expire-trials

# Mode safe : log les subs qui seraient expirées, ne persiste rien.
php bin/console subscriptions:expire-trials --dry-run

# Purge les BlockedToken (jti révoqués) dont expiresAt est passé.
php bin/console tokens:cleanup
```

---

## Choix de design notables

- **`OrganizationVoter` via `MemberRepository::findOneBy`** plutôt que de charger toute la collection des members en PHP : requête SQL ciblée, pas de chargement inutile.
- **Import bulk write-only** : pas de `OrganizationContext` ni de filtre Doctrine actif dans `ImportArticlesHandler` — c'est un handler write-only avec FK explicite (`setOrganization()`), pas de SELECT à scoper. Les 2 entités utiles (org + author) sont fetchées par ID.
- **Best-effort sur l'import** : items invalides loggés en `warning` et skippés, le batch continue. Mieux qu'un import all-or-nothing pour des fichiers de 10k items.
- **Index `(organization_id, status)`** sur la table `article` pour accélérer les listings filtrés par statut au sein d'une org.

---

## Ce que ce projet démontre

- Maîtrise de **Symfony 8** et **PHP 8.4** sur les nouveautés récentes (property hooks, enums enrichis, JsonStreamer, `#[AsCommand]` + `#[Option]`, `expose_security_errors` enum).
- Conception d'**architectures multi-tenant sécurisées** : isolation au niveau SQL via Doctrine Filter, double-check par Voters, distinction 404 vs 403 réfléchie pour ne pas trahir l'existence d'une ressource cross-tenant.
- Pratique du **streaming** sur les traitements de masse (import + export) avec mémoire constante, batch flush, gestion correcte du detach après `clear()`.
- Distinction claire **Events synchrones (transaction)** vs **Messenger async (latence-tolérant)**, avec une règle d'équipe explicite sur le moment du `dispatch` (avant ou après `flush`).
- Approche **domain-driven** : règles métier dans les entités (hooks) et les enums (transitions, permissions), Voters fins qui ne font que déléguer, controllers qui ne font qu'orchestrer.
- Souci du **contrat d'API** : DTO explicites, statuts HTTP corrects (404 cross-tenant, 409 transition, 422 validation, 403 autorisation), spec OpenAPI 3.0 générée et viewer Swagger UI.
