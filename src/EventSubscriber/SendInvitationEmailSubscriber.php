<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\MemberInvitedEvent;
use App\Message\SendInvitationEmailMessage;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class SendInvitationEmailSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private MessageBusInterface $bus,
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
        $this->bus->dispatch(new SendInvitationEmailMessage($event->member->getId()));
    }
}
