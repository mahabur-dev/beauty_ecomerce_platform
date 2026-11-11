<?php

namespace App\Domain\Review\Enums;

enum ReviewUploadIntentStatus: string
{
    case Pending = 'pending';
    case Finalized = 'finalized';
    case Expired = 'expired';
    case Cancelled = 'cancelled';
}
