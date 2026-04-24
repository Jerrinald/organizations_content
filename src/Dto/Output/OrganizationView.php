<?php

declare(strict_types=1);

namespace App\Dto\Output;

use App\Entity\Organization;
use Symfony\Component\ObjectMapper\Attribute\Map;

#[Map(source: Organization::class)]
class OrganizationView
{
    #[Map(source: 'id', transform: 'strval')]
    public string $id;

    public string $name;

    public string $slug;

    #[Map(source: 'createdAt', transform: [self::class, 'formatDate'])]
    public string $createdAt;

    #[Map(source: 'updatedAt', transform: [self::class, 'formatDate'])]
    public string $updatedAt;

    public static function formatDate(\DateTimeImmutable $date): string
    {
        return $date->format('c');
    }
}
