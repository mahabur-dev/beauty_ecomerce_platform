<?php

namespace App\Domain\Media\Data;

final readonly class UploadedAsset
{
    public function __construct(
        public string $publicId,
        public string $assetId,
        public string $resourceType,
        public string $deliveryType,
        public string $secureUrl,
        public string $format,
        public int $bytes,
        public ?int $width,
        public ?int $height,
    ) {}
}
