<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\Member;
use App\Entity\User;

final readonly class MemberInvitedEvent
{
    public function __construct(
        public Member $member,
        public User $invitedBy,
    ) {
    }
}
