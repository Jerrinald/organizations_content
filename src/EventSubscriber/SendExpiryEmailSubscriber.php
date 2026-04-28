<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\SubscriptionExpiredEvent;
use App\Message\SendExpiryEmailMessage;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class SendExpiryEmailSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private MessageBusInterface $bus,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            SubscriptionExpiredEvent::class => 'onSubscriptionExpired',
        ];
    }

    public function onSubscriptionExpired(SubscriptionExpiredEvent $event): void
    {
        $this->bus->dispatch(new SendExpiryEmailMessage($event->subscription->getId()));
    }
}
