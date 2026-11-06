<?php

namespace App\Domain\Catalog\Exceptions;

use RuntimeException;

final class CatalogRuleException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status = 422,
        public readonly string $title = 'Catalog rule violation',
    ) {
        parent::__construct($message);
    }
}
