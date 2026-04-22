<?php

namespace App\Doctrine\Filter;

use App\Doctrine\TenantScoped;
use Doctrine\ORM\Mapping\ClassMetadata;
use Doctrine\ORM\Query\Filter\SQLFilter;

final class OrganizationFilter extends SQLFilter
{
    public const PARAMETER = 'organization_id';

    public function addFilterConstraint(ClassMetadata $targetEntity, string $targetTableAlias): string
    {
        if (!$targetEntity->reflClass?->implementsInterface(TenantScoped::class)) {
            return '';
        }

        return sprintf('%s.organization_id = %s', $targetTableAlias, $this->getParameter(self::PARAMETER));
    }
}
