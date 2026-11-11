<?php

namespace App\Domain\Review\Contracts;

use App\Domain\Review\Data\SignedMediaUrl;
use App\Domain\Review\Data\SignedReviewUpload;
use App\Domain\Review\Data\VerifiedReviewAsset;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;

interface ReviewMediaStorage
{
    public function createSignedUpload(ReviewUploadIntent $intent): SignedReviewUpload;

    public function verifyUploadedAsset(ReviewUploadIntent $intent): VerifiedReviewAsset;

    public function signedDeliveryUrl(ReviewMedia $media, int $ttlSeconds): SignedMediaUrl;

    public function delete(string $publicId, string $resourceType, string $deliveryType): void;
}
