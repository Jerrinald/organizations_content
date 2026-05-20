// Mirror des enums PHP (App\Enum) en objet `as const` + union. La valeur string
// doit matcher l'enum PHP au caractère près.

// ─── MemberRole ─────────────────────────────────────────────────────────────

export const MemberRole = {
  Owner: 'owner',
  Admin: 'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole]

// Rôles invitables (Owner exclu : auto-attribué au créateur). Ordre = celui du
// <select>, du moins au plus privilégié.
export const INVITABLE_ROLES = [
  MemberRole.Viewer,
  MemberRole.Editor,
  MemberRole.Admin,
] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export const memberRoleLabel = (role: MemberRole): string =>
  ({
    owner: 'Propriétaire',
    admin: 'Administrateur',
    editor: 'Éditeur',
    viewer: 'Observateur',
  })[role]

export const canManageMembers = (role: MemberRole): boolean =>
  role === 'owner' || role === 'admin'

export const canPublish = (role: MemberRole): boolean =>
  role === 'owner' || role === 'admin' || role === 'editor'

export const canManageBilling = (role: MemberRole): boolean => role === 'owner'

export const canEditOrganization = (role: MemberRole): boolean =>
  role === 'owner' || role === 'admin'

export const canDeleteArticles = (role: MemberRole): boolean =>
  role === 'owner' || role === 'admin'

export const canDeleteOrganization = (role: MemberRole): boolean => role === 'owner'

// ─── ArticleStatus ──────────────────────────────────────────────────────────

export const ArticleStatus = {
  Draft: 'draft',
  Published: 'published',
  Archived: 'archived',
} as const
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus]

export const articleStatusLabel = (status: ArticleStatus): string =>
  ({ draft: 'Brouillon', published: 'Publié', archived: 'Archivé' })[status]

const articleTransitions: Record<ArticleStatus, readonly ArticleStatus[]> = {
  draft: ['published', 'archived'],
  published: ['archived'],
  archived: ['draft'],
}

export const canTransitionArticleStatus = (
  from: ArticleStatus,
  to: ArticleStatus,
): boolean => articleTransitions[from].includes(to)

export const allowedArticleTransitions = (from: ArticleStatus): readonly ArticleStatus[] =>
  articleTransitions[from]

// ─── PlanTier ───────────────────────────────────────────────────────────────
// ⚠ La valeur de `Max` est `'business'` côté backend.

export const PlanTier = {
  Free: 'free',
  Basic: 'basic',
  Max: 'business',
} as const
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier]

export const planTierLabel = (plan: PlanTier): string =>
  ({ free: 'Gratuit', basic: 'Basic', business: 'Max' })[plan]

// null = illimité
export const planMaxArticles = (plan: PlanTier): number | null =>
  ({ free: 50, basic: 1000, business: null })[plan]

export const planMaxMembers = (plan: PlanTier): number | null =>
  ({ free: 3, basic: 25, business: null })[plan]

export const planCanExport = (plan: PlanTier): boolean => plan !== 'free'

export const planMonthlyPriceCents = (plan: PlanTier): number =>
  ({ free: 0, basic: 1900, business: 4900 })[plan]

// ─── SubscriptionStatus ─────────────────────────────────────────────────────

export const SubscriptionStatus = {
  Trialing: 'trialing',
  Active: 'active',
  PastDue: 'past_due',
  Canceled: 'canceled',
} as const
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const subscriptionStatusLabel = (status: SubscriptionStatus): string =>
  ({
    trialing: "Période d'essai",
    active: 'Actif',
    past_due: 'Paiement en retard',
    canceled: 'Annulé',
  })[status]

const subscriptionTransitions: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  trialing: ['active', 'past_due', 'canceled'],
  active: ['past_due', 'canceled'],
  past_due: ['active', 'canceled'],
  canceled: [],
}

export const canTransitionSubscriptionStatus = (
  from: SubscriptionStatus,
  to: SubscriptionStatus,
): boolean => subscriptionTransitions[from].includes(to)

// ─── ArticleImportStatus ────────────────────────────────────────────────────

export const ArticleImportStatus = {
  Queued: 'queued',
  Processing: 'processing',
  Success: 'success',
  Failed: 'failed',
} as const
export type ArticleImportStatus = (typeof ArticleImportStatus)[keyof typeof ArticleImportStatus]

export const articleImportStatusLabel = (status: ArticleImportStatus): string =>
  ({
    queued: 'En attente',
    processing: 'En cours',
    success: 'Terminé',
    failed: 'Échec',
  })[status]

// Statuts terminaux : le polling s'arrête là.
export const isTerminalImportStatus = (status: ArticleImportStatus): boolean =>
  status === 'success' || status === 'failed'
