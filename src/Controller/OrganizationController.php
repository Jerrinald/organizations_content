<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\Input\CreateOrganizationInput;
use App\Dto\Input\UpdateOrganizationInput;
use App\Dto\Output\OrganizationView;
use App\Entity\Organization;
use App\Entity\User;
use App\Event\OrganizationCreatedEvent;
use App\Repository\OrganizationRepository;
use App\Security\Voter\OrganizationVoter;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Psr\EventDispatcher\EventDispatcherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\ObjectMapper\ObjectMapperInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/organizations')]
#[OA\Tag(name: 'Organizations')]
final class OrganizationController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(
        #[MapRequestPayload] CreateOrganizationInput $input,
        #[CurrentUser] User $user,
        ObjectMapperInterface $objectMapper,
        EntityManagerInterface $em,
        EventDispatcherInterface $dispatcher,
    ): JsonResponse {
        $organization = $objectMapper->map($input, Organization::class);

        $em->persist($organization);
        $dispatcher->dispatch(new OrganizationCreatedEvent($organization, $user));

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ConflictHttpException('An organization with this slug already exists.');
        }

        return $this->json($objectMapper->map($organization, OrganizationView::class), 201);
    }

    #[Route('', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        OrganizationRepository $organizationRepository,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $organizations = $organizationRepository->findByUser($user);

        $views = array_map(
            fn (Organization $org) => $objectMapper->map($org, OrganizationView::class),
            $organizations,
        );

        return $this->json($views);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(
        Organization $organization,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::VIEW, $organization);

        return $this->json($objectMapper->map($organization, OrganizationView::class));
    }

    #[Route('/{id}', methods: ['PATCH'])]
    public function update(
        Organization $organization,
        #[MapRequestPayload] UpdateOrganizationInput $input,
        EntityManagerInterface $em,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::EDIT, $organization);

        $objectMapper->map($input, $organization);

        try {
            $em->flush();
        } catch (UniqueConstraintViolationException) {
            throw new ConflictHttpException('An organization with this slug already exists.');
        }

        return $this->json($objectMapper->map($organization, OrganizationView::class));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(
        Organization $organization,
        EntityManagerInterface $em,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::DELETE, $organization);

        $em->remove($organization);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
