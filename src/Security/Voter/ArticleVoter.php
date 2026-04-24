<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Article;
use App\Entity\User;
use App\Repository\MemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, Article>
 */
final class ArticleVoter extends Voter
{
    public const string VIEW = 'ARTICLE_VIEW';
    public const string EDIT = 'ARTICLE_EDIT';
    public const string PUBLISH = 'ARTICLE_PUBLISH';
    public const string DELETE = 'ARTICLE_DELETE';

    public function __construct(
        private readonly MemberRepository $memberRepository,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $subject instanceof Article
            && \in_array($attribute, [self::VIEW, self::EDIT, self::PUBLISH, self::DELETE], true);
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
            self::EDIT, self::PUBLISH => $role->canPublish(),
            self::DELETE => $role->canDeleteArticles(),
            default => false,
        };
    }
}
