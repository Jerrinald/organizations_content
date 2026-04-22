<?php

namespace App\Context;

use App\Entity\Organization;
use Symfony\Contracts\Service\ResetInterface;

final class OrganizationContext implements ResetInterface
{
    private ?Organization $organization = null;

    public function set(Organization $organization): void
    {
        $this->organization = $organization;
    }

    public function current(): Organization
    {
        return $this->organization ?? throw new \LogicException(
            'No organization in context. Ensure OrganizationContextListener has resolved the tenant before accessing it.'
        );
    }

    public function has(): bool
    {
        return $this->organization !== null;
    }

    public function reset(): void
    {
        $this->organization = null;
    }
}
