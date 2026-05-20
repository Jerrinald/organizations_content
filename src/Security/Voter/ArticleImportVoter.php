<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\ArticleImport;
use App\Entity\User;
use App\Repository\MemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, ArticleImport>
 */
final class ArticleImportVoter extends Voter
{
    public const string VIEW = 'ARTICLE_IMPORT_VIEW';

    public function __construct(
        private readonly MemberRepository $memberRepository,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $subject instanceof ArticleImport && $attribute === self::VIEW;
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

        return $member->getRole()->canView();
    }
}
