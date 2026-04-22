<?php

declare(strict_types=1);

namespace App\Enum;

enum MemberRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Editor = 'editor';
    case Viewer = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Propriétaire',
            self::Admin => 'Administrateur',
            self::Editor => 'Éditeur',
            self::Viewer => 'Observateur',
        };
    }

    public function canManageMembers(): bool
    {
        return match ($this) {
            self::Owner, self::Admin => true,
            self::Editor, self::Viewer => false,
        };
    }

    public function canPublish(): bool
    {
        return match ($this) {
            self::Owner, self::Admin, self::Editor => true,
            self::Viewer => false,
        };
    }

    public function canManageBilling(): bool
    {
        return $this === self::Owner;
    }

    public function canView(): bool
    {
        return true;
    }
}
