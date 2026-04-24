<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Subscription;
use App\Entity\User;
use App\Repository\MemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, Subscription>
 */
final class SubscriptionVoter extends Voter
{
    public const string VIEW = 'SUBSCRIPTION_VIEW';
    public const string MANAGE = 'SUBSCRIPTION_MANAGE';

    public function __construct(
        private readonly MemberRepository $memberRepository,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $subject instanceof Subscription
            && \in_array($attribute, [self::VIEW, self::MANAGE], true);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $member = $this->memberRepository->findOneBy([
            'organization' => $subject->getOrganization(),
            'user' => $user,
        ]);
        if ($member === null) {
            return false;
        }

        $role = $member->getRole();

        return match ($attribute) {
            self::VIEW => $role->canView(),
            self::MANAGE => $role->canManageBilling(),
            default => false,
        };
    }
}
