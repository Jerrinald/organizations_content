<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\Output\ArticleView;
use App\Dto\Output\MemberView;
use App\Dto\Output\OrganizationView;
use App\Dto\Output\SubscriptionView;
use App\Entity\Organization;
use App\Repository\ArticleRepository;
use App\Repository\MemberRepository;
use App\Repository\SubscriptionRepository;
use App\Security\Voter\OrganizationVoter;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;
use Symfony\Component\ObjectMapper\ObjectMapperInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Streame l'org en JSON. Single-format par design : si on ajoute CSV/ZIP plus tard,
 * extraire une interface `OrganizationExporter` + dispatch via content negotiation,
 * ne pas bricoler ce controller pour qu'il gère plusieurs formats.
 */
#[Route('/api/organizations/{id}/export', methods: ['GET'])]
#[OA\Tag(name: 'Organizations')]
final class OrganizationExportController extends AbstractController
{
    private const int BATCH_SIZE = 100;

    public function __invoke(
        Organization $organization,
        ObjectMapperInterface $objectMapper,
        MemberRepository $memberRepository,
        ArticleRepository $articleRepository,
        SubscriptionRepository $subscriptionRepository,
    ): StreamedJsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::EXPORT, $organization);

        $subscription = $subscriptionRepository->findOneBy(['organization' => $organization]);

        $payload = [
            'organization' => $objectMapper->map($organization, OrganizationView::class),
            'subscription' => $subscription !== null
                ? $objectMapper->map($subscription, SubscriptionView::class)
                : null,
            'members' => $this->iterateMembers($memberRepository, $organization, $objectMapper),
            'articles' => $this->iterateArticles($articleRepository, $organization, $objectMapper),
        ];

        $filename = sprintf('organization-%s-export.json', $organization->getSlug());

        return new StreamedJsonResponse($payload, headers: [
            'Content-Disposition' => sprintf('attachment; filename="%s"', $filename),
        ]);
    }

    /**
     * @return \Generator<MemberView>
     */
    private function iterateMembers(
        MemberRepository $memberRepository,
        Organization $organization,
        ObjectMapperInterface $objectMapper,
    ): \Generator {
        $offset = 0;
        do {
            $members = $memberRepository->findBy(
                ['organization' => $organization],
                ['invitedAt' => 'ASC'],
                self::BATCH_SIZE,
                $offset,
            );
            foreach ($members as $member) {
                yield $objectMapper->map($member, MemberView::class);
            }
            $offset += self::BATCH_SIZE;
        } while (\count($members) === self::BATCH_SIZE);
    }

    /**
     * @return \Generator<ArticleView>
     */
    private function iterateArticles(
        ArticleRepository $articleRepository,
        Organization $organization,
        ObjectMapperInterface $objectMapper,
    ): \Generator {
        $offset = 0;
        do {
            $articles = $articleRepository->findBy(
                ['organization' => $organization],
                ['createdAt' => 'ASC'],
                self::BATCH_SIZE,
                $offset,
            );
            foreach ($articles as $article) {
                yield $objectMapper->map($article, ArticleView::class);
            }
            $offset += self::BATCH_SIZE;
        } while (\count($articles) === self::BATCH_SIZE);
    }
}
