<?php

declare(strict_types=1);

namespace App\Enum;

enum PlanTier: string
{
    case Free = 'free';
    case Basic = 'basic';
    case Max = 'business';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Gratuit',
            self::Basic => 'Basic',
            self::Max => 'Max',
        };
    }

    /**
     * @return int|null null = illimité
     */
    public function maxArticles(): ?int
    {
        return match ($this) {
            self::Free => 50,
            self::Basic => 1000,
            self::Max => null,
        };
    }

    /**
     * @return int|null null = illimité
     */
    public function maxMembers(): ?int
    {
        return match ($this) {
            self::Free => 3,
            self::Basic => 25,
            self::Max => null,
        };
    }

    public function canExport(): bool
    {
        return match ($this) {
            self::Free => false,
            self::Basic, self::Max => true,
        };
    }

    public function monthlyPriceCents(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Basic => 1900,
            self::Max => 4900,
        };
    }
}
