<?php

declare(strict_types=1);

namespace App\Dto\Input;

use App\Entity\Article;
use Symfony\Component\ObjectMapper\Attribute\Map;
use Symfony\Component\Validator\Constraints as Assert;

#[Map(target: Article::class)]
class CreateArticleInput
{
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    public string $title;

    #[Assert\NotBlank]
    public string $content;

    #[Map(if: [self::class, 'isNotNull'])]
    #[Assert\Length(max: 255)]
    #[Assert\Regex(
        pattern: '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
        message: 'Le slug doit être en kebab-case (minuscules, chiffres et tirets).',
    )]
    public ?string $slug = null;

    public static function isNotNull(mixed $value): bool
    {
        return $value !== null;
    }
}
