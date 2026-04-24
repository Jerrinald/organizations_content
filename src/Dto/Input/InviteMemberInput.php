<?php

declare(strict_types=1);

namespace App\Dto\Input;

use App\Enum\MemberRole;
use Symfony\Component\Validator\Constraints as Assert;

class InviteMemberInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    public string $email;

    /**
     * Owner est exclu : il est attribué automatiquement au créateur de l'organisation
     * et n'est pas transférable via ce flux d'invitation.
     */
    #[Assert\Choice(
        choices: [MemberRole::Admin, MemberRole::Editor, MemberRole::Viewer],
        message: 'Rôle invalide. Valeurs autorisées : Admin, Editor, Viewer.',
    )]
    public MemberRole $role = MemberRole::Viewer;
}
