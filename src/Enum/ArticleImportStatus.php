<?php

declare(strict_types=1);

namespace App\Enum;

enum ArticleImportStatus: string
{
    case Queued = 'queued';
    case Processing = 'processing';
    case Success = 'success';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'En attente',
            self::Processing => 'En cours',
            self::Success => 'Terminé',
            self::Failed => 'Échec',
        };
    }

    public function isTerminal(): bool
    {
        return $this === self::Success || $this === self::Failed;
    }
}
