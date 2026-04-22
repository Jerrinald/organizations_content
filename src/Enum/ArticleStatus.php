<?php

declare(strict_types=1);

namespace App\Enum;

enum ArticleStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Published => 'Publié',
            self::Archived => 'Archivé',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Draft => $next === self::Published || $next === self::Archived,
            self::Published => $next === self::Archived,
            self::Archived => $next === self::Draft,
        };
    }
}
