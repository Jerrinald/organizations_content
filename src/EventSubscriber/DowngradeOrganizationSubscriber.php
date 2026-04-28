<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Enum\PlanTier;
use App\Event\SubscriptionExpiredEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class DowngradeOrganizationSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            SubscriptionExpiredEvent::class => 'onSubscriptionExpired',
        ];
    }

    public function onSubscriptionExpired(SubscriptionExpiredEvent $event): void
    {
        $event->subscription->setPlan(PlanTier::Free);
    }
}
