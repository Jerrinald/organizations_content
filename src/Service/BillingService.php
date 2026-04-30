<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Subscription;
use App\Enum\SubscriptionStatus;

/**
 * Façade métier autour des subscriptions.
 *
 * Le constructeur reçoit un `InvoicePdfRenderer` lazy : tant qu'aucune méthode
 * de rendu n'est appelée (renderInvoice / invoiceFilename), le proxy n'est
 * jamais matérialisé et Twig n'est pas instancié.
 */
final class BillingService
{
    public function __construct(
        private readonly InvoicePdfRenderer $renderer,
    ) {
    }

    public function isInvoiceable(Subscription $subscription): bool
    {
        return $subscription->status === SubscriptionStatus::Active;
    }

    public function currentAmountCents(Subscription $subscription): int
    {
        return $subscription->getPlan()->monthlyPriceCents();
    }

    public function nextRenewalDate(Subscription $subscription): ?\DateTimeImmutable
    {
        return $subscription->getCurrentPeriodEndsAt();
    }

    public function renderInvoice(Subscription $subscription): string
    {
        return $this->renderer->render($subscription);
    }

    public function invoiceFilename(Subscription $subscription): string
    {
        return $this->renderer->filename($subscription);
    }
}
