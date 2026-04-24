<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\Organization;
use App\Entity\User;

final readonly class OrganizationCreatedEvent
{
    public function __construct(
        public Organization $organization,
        public User $creator,
    ) {
    }
}
