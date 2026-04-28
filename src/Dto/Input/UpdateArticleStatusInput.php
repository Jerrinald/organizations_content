<?php

declare(strict_types=1);

namespace App\Dto\Input;

use App\Enum\ArticleStatus;

class UpdateArticleStatusInput
{
    public ArticleStatus $status;
}
