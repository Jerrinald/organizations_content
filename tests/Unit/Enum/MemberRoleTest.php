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
     * @param array{canManageMembers: bool, canPublish: bool, canManageBilling: bool, canView: bool, canEditOrganization: bool, canDeleteArticles: bool, canDeleteOrganization: bool} $expected
     */
    #[DataProvider('permissionsMatrix')]
    public function testPermissionsMatrix(MemberRole $role, array $expected): void
    {
        self::assertSame($expected['canManageMembers'], $role->canManageMembers(), 'canManageMembers');
        self::assertSame($expected['canPublish'], $role->canPublish(), 'canPublish');
        self::assertSame($expected['canManageBilling'], $role->canManageBilling(), 'canManageBilling');
        self::assertSame($expected['canView'], $role->canView(), 'canView');
        self::assertSame($expected['canEditOrganization'], $role->canEditOrganization(), 'canEditOrganization');
        self::assertSame($expected['canDeleteArticles'], $role->canDeleteArticles(), 'canDeleteArticles');
        self::assertSame($expected['canDeleteOrganization'], $role->canDeleteOrganization(), 'canDeleteOrganization');
    }

    public static function permissionsMatrix(): iterable
    {
        yield 'Owner a tous les droits' => [
            MemberRole::Owner,
            ['canManageMembers' => true, 'canPublish' => true, 'canManageBilling' => true, 'canView' => true, 'canEditOrganization' => true, 'canDeleteArticles' => true, 'canDeleteOrganization' => true],
        ];
        yield 'Admin gère members + publie + édite l\'org mais pas le billing ni la suppression' => [
            MemberRole::Admin,
            ['canManageMembers' => true, 'canPublish' => true, 'canManageBilling' => false, 'canView' => true, 'canEditOrganization' => true, 'canDeleteArticles' => true, 'canDeleteOrganization' => false],
        ];
        yield 'Editor publie uniquement' => [
            MemberRole::Editor,
            ['canManageMembers' => false, 'canPublish' => true, 'canManageBilling' => false, 'canView' => true, 'canEditOrganization' => false, 'canDeleteArticles' => false, 'canDeleteOrganization' => false],
        ];
        yield 'Viewer lit seulement' => [
            MemberRole::Viewer,
            ['canManageMembers' => false, 'canPublish' => false, 'canManageBilling' => false, 'canView' => true, 'canEditOrganization' => false, 'canDeleteArticles' => false, 'canDeleteOrganization' => false],
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
