<?php

declare(strict_types=1);

namespace App\Enum;

enum SubscriptionStatus: string
{
    case Trialing = 'trialing';
    case Active = 'active';
    case PastDue = 'past_due';
    case Canceled = 'canceled';

    public function label(): string
    {
        return match ($this) {
            self::Trialing => 'Période d\'essai',
            self::Active => 'Actif',
            self::PastDue => 'Paiement en retard',
            self::Canceled => 'Annulé',
        };
    }

    /**
     * Transitions autorisées :
     *   Trialing → Active | PastDue | Canceled    (PastDue = trial expiré sans paiement, recouvrement possible)
     *   Active   → PastDue | Canceled
     *   PastDue  → Active  | Canceled             (Active = paiement recouvré, seul retour « arrière » autorisé)
     *   Canceled → ∅
     */
    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Trialing => $next === self::Active || $next === self::PastDue || $next === self::Canceled,
            self::Active   => $next === self::PastDue || $next === self::Canceled,
            self::PastDue  => $next === self::Active || $next === self::Canceled,
            self::Canceled => false,
        };
    }
}
