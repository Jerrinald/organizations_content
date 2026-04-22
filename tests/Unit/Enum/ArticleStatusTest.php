<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum;

use App\Enum\ArticleStatus;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(ArticleStatus::class)]
final class ArticleStatusTest extends TestCase
{
    public function testThreeCasesExist(): void
    {
        self::assertCount(3, ArticleStatus::cases());
    }

    #[DataProvider('allowedTransitions')]
    public function testAllowedTransitionsReturnTrue(ArticleStatus $from, ArticleStatus $to): void
    {
        self::assertTrue($from->canTransitionTo($to), sprintf('%s → %s devrait être autorisée', $from->value, $to->value));
    }

    public static function allowedTransitions(): iterable
    {
        yield 'Draft → Published' => [ArticleStatus::Draft, ArticleStatus::Published];
        yield 'Draft → Archived' => [ArticleStatus::Draft, ArticleStatus::Archived];
        yield 'Published → Archived' => [ArticleStatus::Published, ArticleStatus::Archived];
        yield 'Archived → Draft' => [ArticleStatus::Archived, ArticleStatus::Draft];
    }

    #[DataProvider('forbiddenTransitions')]
    public function testForbiddenTransitionsReturnFalse(ArticleStatus $from, ArticleStatus $to): void
    {
        self::assertFalse($from->canTransitionTo($to), sprintf('%s → %s devrait être interdite', $from->value, $to->value));
    }

    public static function forbiddenTransitions(): iterable
    {
        yield 'Draft → Draft (no-op)' => [ArticleStatus::Draft, ArticleStatus::Draft];
        yield 'Published → Draft (dépubliser passe par Archived)' => [ArticleStatus::Published, ArticleStatus::Draft];
        yield 'Published → Published (no-op)' => [ArticleStatus::Published, ArticleStatus::Published];
        yield 'Archived → Published (force repasse par Draft)' => [ArticleStatus::Archived, ArticleStatus::Published];
        yield 'Archived → Archived (no-op)' => [ArticleStatus::Archived, ArticleStatus::Archived];
    }

    #[DataProvider('labelsProvider')]
    public function testLabels(ArticleStatus $status, string $expected): void
    {
        self::assertSame($expected, $status->label());
    }

    public static function labelsProvider(): iterable
    {
        yield [ArticleStatus::Draft, 'Brouillon'];
        yield [ArticleStatus::Published, 'Publié'];
        yield [ArticleStatus::Archived, 'Archivé'];
    }
}
