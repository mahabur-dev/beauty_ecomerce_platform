<?php

namespace App\Domain\Review\Enums;

enum ReviewMediaKind: string
{
    case Image = 'image';
    case Video = 'video';
}
