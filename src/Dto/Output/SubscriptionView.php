<?php

declare(strict_types=1);

namespace App\Dto\Output;

use App\Entity\Subscription;
use App\Enum\PlanTier;
use App\Enum\SubscriptionStatus;
use Symfony\Component\ObjectMapper\Attribute\Map;

#[Map(source: Subscription::class)]
class SubscriptionView
{
    #[Map(source: 'id', transform: 'strval')]
    public string $id;

    public PlanTier $plan;

    public SubscriptionStatus $status;

    #[Map(source: 'trialEndsAt', transform: [self::class, 'formatDate'])]
    public string $trialEndsAt;

    #[Map(source: 'currentPeriodEndsAt', transform: [self::class, 'formatNullableDate'])]
    public ?string $currentPeriodEndsAt;

    public static function formatDate(\DateTimeImmutable $date): string
    {
        return $date->format('c');
    }

    public static function formatNullableDate(?\DateTimeImmutable $date): ?string
    {
        return $date?->format('c');
    }
}
