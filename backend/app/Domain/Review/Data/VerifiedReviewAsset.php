<?php

namespace App\Domain\Review\Data;

final readonly class VerifiedReviewAsset
{
    public function __construct(
        public string $publicId,
        public string $assetId,
        public string $resourceType,
        public string $deliveryType,
        public string $format,
        public string $mimeType,
        public int $bytes,
        public ?int $width,
        public ?int $height,
        public ?float $durationSeconds,
    ) {}
}
