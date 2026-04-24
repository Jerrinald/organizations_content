<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventListener;

use App\Context\OrganizationContext;
use App\Doctrine\Filter\OrganizationFilter;
use App\Entity\Member;
use App\Entity\Organization;
use App\EventListener\OrganizationContextListener;
use App\Repository\MemberRepository;
use App\Repository\OrganizationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query\FilterCollection;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\UuidV7;

#[CoversClass(OrganizationContextListener::class)]
#[AllowMockObjectsWithoutExpectations]
final class OrganizationContextListenerTest extends TestCase
{
    private Security&MockObject $security;
    private OrganizationRepository&MockObject $organizationRepository;
    private MemberRepository&MockObject $memberRepository;
    private OrganizationContext $organizationContext;
    private EntityManagerInterface&MockObject $entityManager;
    private OrganizationContextListener $listener;

    protected function setUp(): void
    {
        $this->security = $this->createMock(Security::class);
        $this->organizationRepository = $this->createMock(OrganizationRepository::class);
        $this->memberRepository = $this->createMock(MemberRepository::class);
        $this->organizationContext = new OrganizationContext();
        $this->entityManager = $this->createMock(EntityManagerInterface::class);

        $this->listener = new OrganizationContextListener(
            $this->security,
            $this->organizationRepository,
            $this->memberRepository,
            $this->organizationContext,
            $this->entityManager,
        );
    }

    public function testSubRequestEstIgnoree(): void
    {
        $request = new Request();
        $request->headers->set(OrganizationContextListener::HEADER, (new UuidV7())->toRfc4122());
        $event = $this->makeEvent($request, HttpKernelInterface::SUB_REQUEST);

        $this->organizationRepository->expects(self::never())->method('find');
        $this->entityManager->expects(self::never())->method('getFilters');

        ($this->listener)($event);

        self::assertFalse($this->organizationContext->has());
    }

    public function testHeaderAbsentNeFaitRien(): void
    {
        $event = $this->makeEvent(new Request());

        $this->organizationRepository->expects(self::never())->method('find');
        $this->entityManager->expects(self::never())->method('getFilters');

        ($this->listener)($event);

        self::assertFalse($this->organizationContext->has());
    }

    public function testUserAnonymeNeFaitRien(): void
    {
        $request = new Request();
        $request->headers->set(OrganizationContextListener::HEADER, (new UuidV7())->toRfc4122());
        $event = $this->makeEvent($request);

        $this->security->method('getUser')->willReturn(null);
        $this->organizationRepository->expects(self::never())->method('find');

        ($this->listener)($event);

        self::assertFalse($this->organizationContext->has());
    }

    public function testUuidInvalideLeve400(): void
    {
        $request = new Request();
        $request->headers->set(OrganizationContextListener::HEADER, 'not-a-uuid');
        $event = $this->makeEvent($request);

        $this->security->method('getUser')->willReturn($this->createMock(UserInterface::class));
        $this->organizationRepository->expects(self::never())->method('find');

        $this->expectException(BadRequestHttpException::class);

        ($this->listener)($event);
    }

    public function testOrganizationInconnueLeve404(): void
    {
        $request = new Request();
        $request->headers->set(OrganizationContextListener::HEADER, (new UuidV7())->toRfc4122());
        $event = $this->makeEvent($request);

        $this->security->method('getUser')->willReturn($this->createMock(UserInterface::class));
        $this->organizationRepository->method('find')->willReturn(null);
        $this->memberRepository->expects(self::never())->method('findOneBy');

        $this->expectException(NotFoundHttpException::class);

        ($this->listener)($event);
    }

    /**
     * Invariant sécurité multi-tenant : un user qui envoie le header d'une org
     * dont il n'est pas membre reçoit 404 (pas 403), pour ne pas trahir l'existence
     * de l'organisation (cf. docs/architecture.md §7).
     */
    public function testUserNonMembreRecoit404(): void
    {
        $organization = $this->makeOrganization();
        $request = new Request();
        $request->headers->set(OrganizationContextListener::HEADER, $organization->getId()->toRfc4122());
        $event = $this->makeEvent($request);

        $user = $this->createMock(UserInterface::class);
        $this->security->method('getUser')->willReturn($user);
        $this->organizationRepository->method('find')->willReturn($organization);
        $this->memberRepository
            ->expects(self::once())
            ->method('findOneBy')
            ->with(['organization' => $organization, 'user' => $user])
            ->willReturn(null);

        $this->entityManager->expects(self::never())->method('getFilters');

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Organization not found.');

        try {
            ($this->listener)($event);
        } finally {
            self::assertFalse(
                $this->organizationContext->has(),
                'Le context doit rester vide si le user n\'est pas membre.',
            );
        }
    }

    public function testMembreResoutContextEtActiveFiltre(): void
    {
        $organization = $this->makeOrganization();
        $request = new Request();
        $request->headers->set(OrganizationContextListener::HEADER, $organization->getId()->toRfc4122());
        $event = $this->makeEvent($request);

        $user = $this->createMock(UserInterface::class);
        $membership = $this->createMock(Member::class);

        $this->security->method('getUser')->willReturn($user);
        $this->organizationRepository->method('find')->willReturn($organization);
        $this->memberRepository
            ->expects(self::once())
            ->method('findOneBy')
            ->with(['organization' => $organization, 'user' => $user])
            ->willReturn($membership);

        // SQLFilter::setParameter est final → non-mockable. On instancie un vrai
        // OrganizationFilter avec l'EM mock ; le paramètre posé est vérifié par
        // le test d'intégration Doctrine (étape 3, test 2).
        $filter = new OrganizationFilter($this->entityManager);

        $filters = $this->createMock(FilterCollection::class);
        $filters->expects(self::once())
            ->method('enable')
            ->with(OrganizationContextListener::FILTER_NAME)
            ->willReturn($filter);

        // getFilters() est appelé 2 fois : une par le listener, une par
        // SQLFilter::setParameter qui marque la collection comme "dirty".
        $this->entityManager->method('getFilters')->willReturn($filters);

        ($this->listener)($event);

        self::assertTrue($this->organizationContext->has());
        self::assertSame($organization, $this->organizationContext->current());
    }

    private function makeEvent(Request $request, int $type = HttpKernelInterface::MAIN_REQUEST): RequestEvent
    {
        return new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            $type,
        );
    }

    private function makeOrganization(): Organization
    {
        $organization = new Organization();
        $organization->setName('Acme');
        $organization->setSlug('acme');

        return $organization;
    }
}
