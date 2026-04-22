<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum;

use App\Enum\SubscriptionStatus;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(SubscriptionStatus::class)]
final class SubscriptionStatusTest extends TestCase
{
    public function testFourCasesExist(): void
    {
        self::assertCount(4, SubscriptionStatus::cases());
    }

    #[DataProvider('allowedTransitions')]
    public function testAllowedTransitionsReturnTrue(SubscriptionStatus $from, SubscriptionStatus $to): void
    {
        self::assertTrue($from->canTransitionTo($to), sprintf('%s → %s devrait être autorisée', $from->value, $to->value));
    }

    public static function allowedTransitions(): iterable
    {
        yield 'Trialing → Active (paiement initial)' => [SubscriptionStatus::Trialing, SubscriptionStatus::Active];
        yield 'Trialing → Canceled (trial non converti)' => [SubscriptionStatus::Trialing, SubscriptionStatus::Canceled];
        yield 'Active → PastDue (paiement échoué)' => [SubscriptionStatus::Active, SubscriptionStatus::PastDue];
        yield 'Active → Canceled (annulation manuelle)' => [SubscriptionStatus::Active, SubscriptionStatus::Canceled];
        yield 'PastDue → Active (recouvrement)' => [SubscriptionStatus::PastDue, SubscriptionStatus::Active];
        yield 'PastDue → Canceled (échec définitif)' => [SubscriptionStatus::PastDue, SubscriptionStatus::Canceled];
    }

    #[DataProvider('forbiddenTransitions')]
    public function testForbiddenTransitionsReturnFalse(SubscriptionStatus $from, SubscriptionStatus $to): void
    {
        self::assertFalse($from->canTransitionTo($to), sprintf('%s → %s devrait être interdite', $from->value, $to->value));
    }

    public static function forbiddenTransitions(): iterable
    {
        // Canceled est un état terminal absolu
        yield 'Canceled → Trialing interdit' => [SubscriptionStatus::Canceled, SubscriptionStatus::Trialing];
        yield 'Canceled → Active interdit' => [SubscriptionStatus::Canceled, SubscriptionStatus::Active];
        yield 'Canceled → PastDue interdit' => [SubscriptionStatus::Canceled, SubscriptionStatus::PastDue];

        // Pas de retour aux états antérieurs
        yield 'Active → Trialing interdit (pas de re-trial)' => [SubscriptionStatus::Active, SubscriptionStatus::Trialing];
        yield 'PastDue → Trialing interdit' => [SubscriptionStatus::PastDue, SubscriptionStatus::Trialing];
        yield 'Trialing → PastDue interdit (pas de paiement avant Active)' => [SubscriptionStatus::Trialing, SubscriptionStatus::PastDue];

        // No-op transitions (pas utiles, on évite les reentry)
        yield 'Trialing → Trialing no-op' => [SubscriptionStatus::Trialing, SubscriptionStatus::Trialing];
        yield 'Active → Active no-op' => [SubscriptionStatus::Active, SubscriptionStatus::Active];
        yield 'PastDue → PastDue no-op' => [SubscriptionStatus::PastDue, SubscriptionStatus::PastDue];
        yield 'Canceled → Canceled no-op' => [SubscriptionStatus::Canceled, SubscriptionStatus::Canceled];
    }

    #[DataProvider('labelsProvider')]
    public function testLabels(SubscriptionStatus $status, string $expected): void
    {
        self::assertSame($expected, $status->label());
    }

    public static function labelsProvider(): iterable
    {
        yield [SubscriptionStatus::Trialing, 'Période d\'essai'];
        yield [SubscriptionStatus::Active, 'Actif'];
        yield [SubscriptionStatus::PastDue, 'Paiement en retard'];
        yield [SubscriptionStatus::Canceled, 'Annulé'];
    }
}
