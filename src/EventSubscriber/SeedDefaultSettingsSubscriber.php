<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\OrganizationCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class SeedDefaultSettingsSubscriber implements EventSubscriberInterface
{
    /**
     * @var array<string, mixed>
     */
    private const DEFAULT_SETTINGS = [
        'features' => [
            'comments' => ['enabled' => false],
            'exports' => ['enabled' => false],
        ],
        'notifications' => [
            'email' => ['enabled' => true],
        ],
    ];

    public static function getSubscribedEvents(): array
    {
        return [
            OrganizationCreatedEvent::class => 'onOrganizationCreated',
        ];
    }

    public function onOrganizationCreated(OrganizationCreatedEvent $event): void
    {
        if ($event->organization->getSettings() === []) {
            $event->organization->setSettings(self::DEFAULT_SETTINGS);
        }
    }
}
