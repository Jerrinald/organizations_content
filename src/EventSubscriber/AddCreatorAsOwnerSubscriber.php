<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\Member;
use App\Enum\MemberRole;
use App\Event\OrganizationCreatedEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class AddCreatorAsOwnerSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            OrganizationCreatedEvent::class => 'onOrganizationCreated',
        ];
    }

    public function onOrganizationCreated(OrganizationCreatedEvent $event): void
    {
        $member = (new Member())
            ->setOrganization($event->organization)
            ->setUser($event->creator)
            ->setRole(MemberRole::Owner)
            ->markJoined();

        $this->em->persist($member);
    }
}
