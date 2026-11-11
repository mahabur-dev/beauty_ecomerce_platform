<?php

namespace App\Domain\Review\Data;

final readonly class SignedReviewUpload
{
    /**
     * @param  array<string, scalar>  $fields
     */
    public function __construct(
        public string $uploadUrl,
        public string $method,
        public array $fields,
    ) {}
}
