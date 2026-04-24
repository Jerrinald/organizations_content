<?php

declare(strict_types=1);

namespace App\Message;

use Symfony\Component\Uid\Uuid;

final readonly class SendInvitationEmailMessage
{
    public function __construct(
        public Uuid $memberId,
    ) {
    }
}
