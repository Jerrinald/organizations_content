<?php

declare(strict_types=1);

namespace App\Controller;

use App\Context\OrganizationContext;
use App\Dto\Input\CreateArticleInput;
use App\Dto\Input\UpdateArticleInput;
use App\Dto\Input\UpdateArticleStatusInput;
use App\Dto\Output\ArticleView;
use App\Entity\Article;
use App\Entity\User;
use App\Enum\ArticleStatus;
use App\Event\ArticlePublishedEvent;
use App\Repository\ArticleRepository;
use App\Repository\MemberRepository;
use App\Security\Voter\ArticleVoter;
use App\Security\Voter\OrganizationVoter;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Psr\EventDispatcher\EventDispatcherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\ObjectMapper\ObjectMapperInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/articles')]
#[OA\Tag(name: 'Articles')]
#[OA\Parameter(ref: '#/components/parameters/OrganizationIdHeader')]
final class ArticleController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] CreateArticleInput $input,
        #[CurrentUser] User $user,
        OrganizationContext $context,
        MemberRepository $memberRepository,
        ObjectMapperInterface $objectMapper,
        EntityManagerInterface $em,
    ): JsonResponse {
        $organization = $context->current();
        $this->denyAccessUnlessGranted(OrganizationVoter::PUBLISH_ARTICLES, $organization);

        $author = $memberRepository->findOneBy(['organization' => $organization, 'user' => $user]);

        $article = $objectMapper->map($input, Article::class);
        $article->setOrganization($organization);
        $article->setAuthor($author);
        $em->persist($article);

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ConflictHttpException('An article with this slug already exists in this organization.');
        }

        return $this->json($objectMapper->map($article, ArticleView::class), 201);
    }

    #[Route('', methods: ['GET'])]
    public function list(
        OrganizationContext $context,
        ArticleRepository $articleRepository,
        ObjectMapperInterface $objectMapper,
        #[MapQueryParameter] int $page = 1,
        #[MapQueryParameter] int $limit = 20,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::VIEW, $context->current());

        $page = max(1, $page);
        $limit = min(100, max(1, $limit));

        $articles = $articleRepository->findBy([], ['createdAt' => 'DESC'], $limit, ($page - 1) * $limit);

        $views = array_map(
            fn (Article $a) => $objectMapper->map($a, ArticleView::class),
            $articles,
        );

        return $this->json($views);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(
        Article $article,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ArticleVoter::VIEW, $article);

        return $this->json($objectMapper->map($article, ArticleView::class));
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(
        Article $article,
        #[MapRequestPayload] UpdateArticleInput $input,
        ObjectMapperInterface $objectMapper,
        EntityManagerInterface $em,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ArticleVoter::EDIT, $article);

        $objectMapper->map($input, $article);

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ConflictHttpException('An article with this slug already exists in this organization.');
        }

        return $this->json($objectMapper->map($article, ArticleView::class));
    }

    #[Route('/{id}/status', methods: ['PATCH'])]
    public function changeStatus(
        Article $article,
        #[MapRequestPayload] UpdateArticleStatusInput $input,
        EntityManagerInterface $em,
        EventDispatcherInterface $dispatcher,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ArticleVoter::PUBLISH, $article);

        try {
            $article->status = $input->status;
        } catch (\DomainException $e) {
            throw new ConflictHttpException($e->getMessage(), $e);
        }

        $em->flush();

        if ($input->status === ArticleStatus::Published) {
            $dispatcher->dispatch(new ArticlePublishedEvent($article));
        }

        return $this->json($objectMapper->map($article, ArticleView::class));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(
        Article $article,
        EntityManagerInterface $em,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ArticleVoter::DELETE, $article);

        $em->remove($article);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
