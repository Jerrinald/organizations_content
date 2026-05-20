<?php

declare(strict_types=1);

namespace App\Dto\Output;

use App\Entity\ArticleImport;
use App\Enum\ArticleImportStatus;
use Symfony\Component\ObjectMapper\Attribute\Map;

#[Map(source: ArticleImport::class)]
class ArticleImportView
{
    #[Map(source: 'id', transform: 'strval')]
    public string $id;

    public ArticleImportStatus $status;

    public int $importedCount;

    public int $skippedCount;

    #[Map(source: 'finishedAt', transform: [self::class, 'formatNullableDate'])]
    public ?string $finishedAt;

    #[Map(source: 'createdAt', transform: [self::class, 'formatDate'])]
    public string $createdAt;

    public static function formatDate(\DateTimeImmutable $date): string
    {
        return $date->format('c');
    }

    public static function formatNullableDate(?\DateTimeImmutable $date): ?string
    {
        return $date?->format('c');
    }
}
