<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Subscription;
use Twig\Environment;

/**
 * Rend la facture HTML d'une subscription (Active uniquement).
 *
 * Déclaré `lazy: true` dans services.yaml : PHP 8.4 retourne un proxy ghost
 * tant qu'aucune méthode n'est appelée. Utile quand ce renderer est injecté
 * dans un service qui regroupe plusieurs méthodes (cf. `BillingService`) et
 * dont seule une partie touche le rendu — les autres méthodes laissent le
 * proxy intact, donc Twig n'est jamais bootstrap.
 */
final class InvoicePdfRenderer
{
    private const string TEMPLATE = 'invoice/invoice.html.twig';
    private const string PERIOD_DURATION = '-30 days';

    public function __construct(
        private readonly Environment $twig,
    ) {
    }

    public function render(Subscription $subscription): string
    {
        $periodEnd = $subscription->getCurrentPeriodEndsAt();
        if ($periodEnd === null) {
            throw new \DomainException('Cannot render invoice: subscription has no current period.');
        }

        return $this->twig->render(self::TEMPLATE, [
            'subscription' => $subscription,
            'periodStart' => $periodEnd->modify(self::PERIOD_DURATION),
        ]);
    }

    public function filename(Subscription $subscription): string
    {
        $periodEnd = $subscription->getCurrentPeriodEndsAt();
        $period = $periodEnd?->format('Y-m') ?? 'unknown';

        return sprintf(
            'invoice-%s-%s.html',
            $subscription->getOrganization()->getSlug(),
            $period,
        );
    }
}
