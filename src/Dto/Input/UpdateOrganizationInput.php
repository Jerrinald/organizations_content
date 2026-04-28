<?php

declare(strict_types=1);

namespace App\Dto\Input;

use App\Entity\Organization;
use Symfony\Component\ObjectMapper\Attribute\Map;
use Symfony\Component\Validator\Constraints as Assert;

#[Map(target: Organization::class)]
class UpdateOrganizationInput
{
    #[Map(if: [self::class, 'isNotNull'])]
    #[Assert\Length(max: 255)]
    public ?string $name = null;

    #[Map(if: [self::class, 'isNotNull'])]
    #[Assert\Length(max: 255)]
    #[Assert\Regex(
        pattern: '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
        message: 'Le slug doit être en kebab-case (minuscules, chiffres et tirets).',
    )]
    public ?string $slug = null;

    /**
     * @var array<string, mixed>|null
     */
    #[Map(if: [self::class, 'isNotNull'])]
    public ?array $settings = null;

    public static function isNotNull(mixed $value): bool
    {
        return $value !== null;
    }
}
