<?php

declare(strict_types=1);

namespace App\Controller;

use App\Context\OrganizationContext;
use App\Entity\User;
use App\Message\ImportArticlesMessage;
use App\Repository\MemberRepository;
use App\Security\Voter\OrganizationVoter;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\UuidV7;

#[Route('/api/articles/import')]
#[OA\Tag(name: 'Articles')]
#[OA\Parameter(ref: '#/components/parameters/OrganizationIdHeader')]
final class ArticleImportController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function import(
        Request $request,
        #[CurrentUser] User $user,
        OrganizationContext $context,
        MemberRepository $memberRepository,
        MessageBusInterface $bus,
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

        $importId = new UuidV7();
        $importsDir = sprintf('%s/var/imports', $projectDir);
        $targetName = sprintf('%s.json', $importId);
        $file->move($importsDir, $targetName);

        $bus->dispatch(new ImportArticlesMessage(
            importId: $importId,
            organizationId: $organization->getId(),
            authorMemberId: $author->getId(),
            filePath: sprintf('%s/%s', $importsDir, $targetName),
        ));

        return new JsonResponse([
            'importId' => (string) $importId,
            'status' => 'queued',
        ], 202);
    }
}
