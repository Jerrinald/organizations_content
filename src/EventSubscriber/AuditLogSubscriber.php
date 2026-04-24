<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\MemberInvitedEvent;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final readonly class AuditLogSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private LoggerInterface $logger,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            MemberInvitedEvent::class => 'onMemberInvited',
        ];
    }

    public function onMemberInvited(MemberInvitedEvent $event): void
    {
        $this->logger->info('member.invited', [
            'organizationId' => (string) $event->member->getOrganization()->getId(),
            'memberId' => (string) $event->member->getId(),
            'invitedUserId' => (string) $event->member->getUser()->getId(),
            'role' => $event->member->getRole()->value,
            'invitedById' => (string) $event->invitedBy->getId(),
        ]);
    }
}
