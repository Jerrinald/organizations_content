<?php

declare(strict_types=1);

namespace App\Dto\Output;

use App\Entity\Member;
use App\Entity\User;
use App\Enum\MemberRole;
use Symfony\Component\ObjectMapper\Attribute\Map;

#[Map(source: Member::class)]
class MemberView
{
    #[Map(source: 'id', transform: 'strval')]
    public string $id;

    #[Map(source: 'user', transform: [self::class, 'formatUserId'])]
    public string $userId;

    #[Map(source: 'user', transform: [self::class, 'formatUserEmail'])]
    public ?string $email;

    public MemberRole $role;

    #[Map(source: 'invitedAt', transform: [self::class, 'formatDate'])]
    public string $invitedAt;

    #[Map(source: 'joinedAt', transform: [self::class, 'formatNullableDate'])]
    public ?string $joinedAt;

    public static function formatUserId(User $user): string
    {
        return $user->getId()->toRfc4122();
    }

    public static function formatUserEmail(User $user): ?string
    {
        return $user->getEmail();
    }

    public static function formatDate(\DateTimeImmutable $date): string
    {
        return $date->format('c');
    }

    public static function formatNullableDate(?\DateTimeImmutable $date): ?string
    {
        return $date?->format('c');
    }
}
