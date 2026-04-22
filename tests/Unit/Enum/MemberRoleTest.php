<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum;

use App\Enum\MemberRole;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(MemberRole::class)]
final class MemberRoleTest extends TestCase
{
    public function testFourCasesExist(): void
    {
        self::assertCount(4, MemberRole::cases());
    }

    /**
     * @param array{canManageMembers: bool, canPublish: bool, canManageBilling: bool, canView: bool} $expected
     */
    #[DataProvider('permissionsMatrix')]
    public function testPermissionsMatrix(MemberRole $role, array $expected): void
    {
        self::assertSame($expected['canManageMembers'], $role->canManageMembers(), 'canManageMembers');
        self::assertSame($expected['canPublish'], $role->canPublish(), 'canPublish');
        self::assertSame($expected['canManageBilling'], $role->canManageBilling(), 'canManageBilling');
        self::assertSame($expected['canView'], $role->canView(), 'canView');
    }

    public static function permissionsMatrix(): iterable
    {
        yield 'Owner a tous les droits' => [
            MemberRole::Owner,
            ['canManageMembers' => true, 'canPublish' => true, 'canManageBilling' => true, 'canView' => true],
        ];
        yield 'Admin gère members + publie mais pas billing' => [
            MemberRole::Admin,
            ['canManageMembers' => true, 'canPublish' => true, 'canManageBilling' => false, 'canView' => true],
        ];
        yield 'Editor publie uniquement' => [
            MemberRole::Editor,
            ['canManageMembers' => false, 'canPublish' => true, 'canManageBilling' => false, 'canView' => true],
        ];
        yield 'Viewer lit seulement' => [
            MemberRole::Viewer,
            ['canManageMembers' => false, 'canPublish' => false, 'canManageBilling' => false, 'canView' => true],
        ];
    }

    #[DataProvider('labelsProvider')]
    public function testLabels(MemberRole $role, string $expected): void
    {
        self::assertSame($expected, $role->label());
    }

    public static function labelsProvider(): iterable
    {
        yield [MemberRole::Owner, 'Propriétaire'];
        yield [MemberRole::Admin, 'Administrateur'];
        yield [MemberRole::Editor, 'Éditeur'];
        yield [MemberRole::Viewer, 'Observateur'];
    }
}
