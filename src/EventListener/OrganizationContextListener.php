<?php

namespace App\EventListener;

use App\Context\OrganizationContext;
use App\Doctrine\Filter\OrganizationFilter;
use App\Repository\MemberRepository;
use App\Repository\OrganizationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;

#[AsEventListener(event: 'kernel.request', priority: 0)]
final class OrganizationContextListener
{
    public const HEADER = 'X-Organization-Id';
    public const FILTER_NAME = 'organization';

    public function __construct(
        private readonly Security $security,
        private readonly OrganizationRepository $organizationRepository,
        private readonly MemberRepository $memberRepository,
        private readonly OrganizationContext $organizationContext,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $headerValue = $event->getRequest()->headers->get(self::HEADER);
        if ($headerValue === null) {
            return;
        }

        $user = $this->security->getUser();
        if ($user === null) {
            return;
        }

        try {
            $organizationId = Uuid::fromString($headerValue);
        } catch (\InvalidArgumentException) {
            throw new BadRequestHttpException(sprintf('Invalid %s header: not a valid UUID.', self::HEADER));
        }

        $organization = $this->organizationRepository->find($organizationId);
        if ($organization === null) {
            throw new NotFoundHttpException('Organization not found.');
        }

        $membership = $this->memberRepository->findOneBy([
            'organization' => $organization,
            'user' => $user,
        ]);
        if ($membership === null) {
            throw new NotFoundHttpException('Organization not found.');
        }

        $this->organizationContext->set($organization);

        $this->entityManager
            ->getFilters()
            ->enable(self::FILTER_NAME)
            ->setParameter(OrganizationFilter::PARAMETER, $organization->getId(), UuidType::NAME);
    }
}
