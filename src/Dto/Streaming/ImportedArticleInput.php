<?php

declare(strict_types=1);

namespace App\Dto\Streaming;

use Symfony\Component\JsonStreamer\Attribute\JsonStreamable;

#[JsonStreamable(asList: true)]
final class ImportedArticleInput
{
    public string $title = '';

    public string $content = '';

    public ?string $slug = null;
}
