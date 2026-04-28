<?php

declare(strict_types=1);

namespace App\Message;

use Symfony\Component\Uid\Uuid;

final readonly class ImportArticlesMessage
{
    public function __construct(
        public Uuid $importId,
        public Uuid $organizationId,
        public Uuid $authorMemberId,
        public string $filePath,
    ) {
    }
}
