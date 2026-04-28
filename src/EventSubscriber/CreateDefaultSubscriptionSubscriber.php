<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\Subscription;
use App\Enum\PlanTier;
use App\Event\OrganizationCreatedEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class CreateDefaultSubscriptionSubscriber implements EventSubscriberInterface
{
    private const TRIAL_DURATION = '+14 days';

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
        $subscription = (new Subscription())
            ->setOrganization($event->organization)
            ->setPlan(PlanTier::Free)
            ->setTrialEndsAt(new \DateTimeImmutable(self::TRIAL_DURATION));

        $this->em->persist($subscription);
    }
}
