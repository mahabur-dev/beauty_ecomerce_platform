<?php

namespace App\Domain\Review\Enums;

enum ReviewMediaStatus: string
{
    case Ready = 'ready';
    case Rejected = 'rejected';
}
