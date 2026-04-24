<?php

declare(strict_types=1);

namespace App\Dto\Output;

use App\Entity\Article;
use App\Entity\Member;
use App\Enum\ArticleStatus;
use Symfony\Component\ObjectMapper\Attribute\Map;

#[Map(source: Article::class)]
class ArticleView
{
    #[Map(source: 'id', transform: 'strval')]
    public string $id;

    public string $title;

    public string $slug;

    public string $content;

    public ArticleStatus $status;

    #[Map(source: 'author', transform: [self::class, 'formatAuthorId'])]
    public string $authorId;

    #[Map(source: 'publishedAt', transform: [self::class, 'formatNullableDate'])]
    public ?string $publishedAt;

    #[Map(source: 'createdAt', transform: [self::class, 'formatDate'])]
    public string $createdAt;

    #[Map(source: 'updatedAt', transform: [self::class, 'formatDate'])]
    public string $updatedAt;

    public static function formatAuthorId(Member $author): string
    {
        return $author->getId()->toRfc4122();
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
