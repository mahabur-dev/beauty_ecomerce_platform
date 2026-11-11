<?php

namespace App\Domain\Review\Exceptions;

use RuntimeException;

final class ReviewRuleException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status = 422,
        public readonly string $title = 'Review rule violation',
    ) {
        parent::__construct($message);
    }
}
