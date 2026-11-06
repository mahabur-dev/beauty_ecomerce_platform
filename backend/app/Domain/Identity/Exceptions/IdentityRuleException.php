<?php

namespace App\Domain\Identity\Exceptions;

use RuntimeException;

final class IdentityRuleException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status = 422,
        public readonly string $title = 'Identity rule violation',
    ) {
        parent::__construct($message);
    }
}
