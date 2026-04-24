<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Organization;
use App\Entity\User;
use App\Repository\MemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, Organization>
 */
final class OrganizationVoter extends Voter
{
    public const string VIEW = 'ORG_VIEW';
    public const string EDIT = 'ORG_EDIT';
    public const string DELETE = 'ORG_DELETE';
    public const string MANAGE_MEMBERS = 'ORG_MANAGE_MEMBERS';
    public const string MANAGE_BILLING = 'ORG_MANAGE_BILLING';
    public const string EXPORT = 'ORG_EXPORT';

    public function __construct(
        private readonly MemberRepository $memberRepository,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $subject instanceof Organization
            && \in_array($attribute, [self::VIEW, self::EDIT, self::DELETE, self::MANAGE_MEMBERS, self::MANAGE_BILLING, self::EXPORT], true);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $member = $this->memberRepository->findOneBy([
            'organization' => $subject,
            'user' => $user,
        ]);
        if ($member === null) {
            return false;
        }

        $role = $member->getRole();

        return match ($attribute) {
            self::VIEW => $role->canView(),
            self::EDIT, self::EXPORT => $role->canEditOrganization(),
            self::DELETE => $role->canDeleteOrganization(),
            self::MANAGE_MEMBERS => $role->canManageMembers(),
            self::MANAGE_BILLING => $role->canManageBilling(),
            default => false,
        };
    }
}
