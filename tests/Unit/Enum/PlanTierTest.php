<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum;

use App\Enum\PlanTier;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(PlanTier::class)]
final class PlanTierTest extends TestCase
{
    public function testThreeCasesExist(): void
    {
        self::assertCount(3, PlanTier::cases());
    }

    /**
     * @param array{maxArticles: int|null, maxMembers: int|null, canExport: bool} $expected
     */
    #[DataProvider('limitsMatrix')]
    public function testLimitsMatrix(PlanTier $tier, array $expected): void
    {
        self::assertSame($expected['maxArticles'], $tier->maxArticles(), 'maxArticles');
        self::assertSame($expected['maxMembers'], $tier->maxMembers(), 'maxMembers');
        self::assertSame($expected['canExport'], $tier->canExport(), 'canExport');
    }

    public static function limitsMatrix(): iterable
    {
        yield 'Free : 50 articles, 3 membres, pas d\'export' => [
            PlanTier::Free,
            ['maxArticles' => 50, 'maxMembers' => 3, 'canExport' => false],
        ];
        yield 'Pro : 1000 articles, 25 membres, export OK' => [
            PlanTier::Pro,
            ['maxArticles' => 1000, 'maxMembers' => 25, 'canExport' => true],
        ];
        yield 'Business : illimité + export OK' => [
            PlanTier::Business,
            ['maxArticles' => null, 'maxMembers' => null, 'canExport' => true],
        ];
    }

    #[DataProvider('labelsProvider')]
    public function testLabels(PlanTier $tier, string $expected): void
    {
        self::assertSame($expected, $tier->label());
    }

    public static function labelsProvider(): iterable
    {
        yield [PlanTier::Free, 'Gratuit'];
        yield [PlanTier::Pro, 'Pro'];
        yield [PlanTier::Business, 'Business'];
    }
}
