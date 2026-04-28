<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\Input\InviteMemberInput;
use App\Dto\Output\MemberView;
use App\Entity\Member;
use App\Entity\Organization;
use App\Entity\User;
use App\Event\MemberInvitedEvent;
use App\Repository\MemberRepository;
use App\Repository\UserRepository;
use App\Security\Voter\OrganizationVoter;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Psr\EventDispatcher\EventDispatcherInterface;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\ObjectMapper\ObjectMapperInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/organizations/{organizationId}/members')]
#[OA\Tag(name: 'Members')]
final class MemberController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(
        #[MapEntity(id: 'organizationId')] Organization $organization,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::VIEW, $organization);

        $views = $organization->getMembers()
            ->map(fn (Member $member) => $objectMapper->map($member, MemberView::class))
            ->toArray();

        return $this->json(array_values($views));
    }

    #[Route('', methods: ['POST'])]
    public function invite(
        #[MapEntity(id: 'organizationId')] Organization $organization,
        #[MapRequestPayload] InviteMemberInput $input,
        #[CurrentUser] User $currentUser,
        UserRepository $userRepository,
        MemberRepository $memberRepository,
        EntityManagerInterface $em,
        EventDispatcherInterface $dispatcher,
        ObjectMapperInterface $objectMapper,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::MANAGE_MEMBERS, $organization);

        $invitedUser = $userRepository->findOneBy(['email' => $input->email]);
        if ($invitedUser === null) {
            throw new UnprocessableEntityHttpException('No user found for this email address.');
        }

        $existing = $memberRepository->findOneBy([
            'organization' => $organization,
            'user' => $invitedUser,
        ]);
        if ($existing !== null) {
            throw new ConflictHttpException('User is already a member of this organization.');
        }

        $member = (new Member())
            ->setOrganization($organization)
            ->setUser($invitedUser)
            ->setRole($input->role)
            ->markJoined();

        $em->persist($member);
        $em->flush();

        $dispatcher->dispatch(new MemberInvitedEvent($member, $currentUser));

        return $this->json($objectMapper->map($member, MemberView::class), 201);
    }

    #[Route('/{memberId}', methods: ['DELETE'])]
    public function remove(
        #[MapEntity(id: 'organizationId')] Organization $organization,
        #[MapEntity(id: 'memberId')] Member $member,
        EntityManagerInterface $em,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(OrganizationVoter::MANAGE_MEMBERS, $organization);

        $em->remove($member);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
