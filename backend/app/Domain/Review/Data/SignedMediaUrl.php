<?php

namespace App\Domain\Review\Data;

use Carbon\CarbonImmutable;

final readonly class SignedMediaUrl
{
    public function __construct(
        public string $url,
        public CarbonImmutable $expiresAt,
    ) {}
}
