<?php

declare(strict_types=1);

namespace App\Controller;

use App\Context\OrganizationContext;
use App\Dto\Output\ArticleImportView;
use App\Entity\ArticleImport;
use App\Entity\User;
use App\Message\ImportArticlesMessage;
use App\Repository\MemberRepository;
use App\Security\Voter\ArticleImportVoter;
use App\Security\Voter\OrganizationVoter;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\ObjectMapper\ObjectMapperInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/articles')]
#[OA\Tag(name: 'Articles')]
#[OA\Parameter(ref: '#/components/parameters/OrganizationIdHeader')]
final class ArticleImportController extends AbstractController
{
    #[Route('/imports', methods: ['POST'])]
    public function import(
        Request $request,
        #[CurrentUser] User $user,
        OrganizationContext $context,
        MemberRepository $memberRepository,
        EntityManagerInterface $em,
        MessageBusInterface $bus,
        ObjectMapperInterface $objectMapper,
        #[Autowire(param: 'kernel.project_dir')] string $projectDir,
    ): JsonResponse {
        $organization = $context->current();
        $this->denyAccessUnlessGranted(OrganizationVoter::PUBLISH_ARTICLES, $organization);

        $author = $memberRepository->findOneBy(['organization' => $organization, 'user' => $user]);

        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');
        if ($file === null) {
            throw new BadRequestHttpException('Missing "file" field in multipart payload.');
        }
        if ($file->getClientMimeType() !== 'application/json' && $file->getClientOriginalExtension() !== 'json') {
            throw new BadRequestHttpException('Only JSON files are accepted.');
        }

        $import = (new ArticleImport())
            ->setOrganization($organization)
            ->setAuthor($author);
        $em->persist($import);
        $em->flush();

        $importsDir = sprintf('%s/var/imports', $projectDir);
        $targetName = sprintf('%s.json', $import->getId());
        $file->move($importsDir, $targetName);

        $bus->dispatch(new ImportArticlesMessage(
            importId: $import->getId(),
            organizationId: $organization->getId(),
            authorMemberId: $author->getId(),
            filePath: sprintf('%s/%s', $importsDir, $targetName),
        ));

        return $this->json($objectMapper->map($import, ArticleImportView::class), 202);
    }

    #[Route('/imports/{id}', methods: ['GET'])]
    public function show(
        ArticleImport $articleImport,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(ArticleImportVoter::VIEW, $articleImport);

        return $this->json($objectMapper->map($articleImport, ArticleImportView::class));
    }
}
