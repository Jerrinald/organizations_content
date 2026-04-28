<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\Subscription;

final readonly class SubscriptionExpiredEvent
{
    public function __construct(
        public Subscription $subscription,
    ) {
    }
}
