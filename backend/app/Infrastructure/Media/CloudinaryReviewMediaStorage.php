<?php

namespace App\Infrastructure\Media;

use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Review\Contracts\ReviewMediaStorage;
use App\Domain\Review\Data\SignedMediaUrl;
use App\Domain\Review\Data\SignedReviewUpload;
use App\Domain\Review\Data\VerifiedReviewAsset;
use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Exceptions\ReviewRuleException;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;
use Carbon\CarbonImmutable;
use Cloudinary\Api\ApiUtils;
use Cloudinary\Api\Exception\ApiError;
use Cloudinary\Cloudinary;
use RuntimeException;

final readonly class CloudinaryReviewMediaStorage implements ReviewMediaStorage
{
    public function __construct(
        private MediaStorage $mediaStorage,
    ) {}

    public function createSignedUpload(ReviewUploadIntent $intent): SignedReviewUpload
    {
        $cloudinary = $this->client();
        $cloud = $cloudinary->configuration->cloud;
        $resourceType = $intent->kind === ReviewMediaKind::Video ? 'video' : 'image';
        /** @var list<string> $allowedFormats */
        $allowedFormats = config("reviews.{$intent->kind->value}.formats", []);

        $params = ApiUtils::finalizeUploadApiParams([
            'public_id' => $intent->provider_asset_key,
            'type' => 'authenticated',
            'overwrite' => false,
            'unique_filename' => false,
            'allowed_formats' => implode(',', $allowedFormats),
        ]);
        ApiUtils::signRequest($params, $cloud);

        $fields = [];
        foreach ($params ?? [] as $key => $value) {
            if (is_scalar($value)) {
                $fields[(string) $key] = $value;
            }
        }

        return new SignedReviewUpload(
            uploadUrl: sprintf('https://api.cloudinary.com/v1_1/%s/%s/upload', $cloud->cloudName, $resourceType),
            method: 'POST',
            fields: $fields,
        );
    }

    public function verifyUploadedAsset(ReviewUploadIntent $intent): VerifiedReviewAsset
    {
        $cloudinary = $this->client();
        $resourceType = $intent->kind === ReviewMediaKind::Video ? 'video' : 'image';

        try {
            $response = $cloudinary->adminApi()->asset($intent->provider_asset_key, [
                'resource_type' => $resourceType,
                'type' => 'authenticated',
            ]);
        } catch (ApiError $exception) {
            throw new ReviewRuleException(
                'The uploaded media asset could not be verified in storage.',
                422,
                'Media verification failed',
            );
        }

        $format = strtolower((string) ($response['format'] ?? ''));
        $verifiedResourceType = strtolower((string) ($response['resource_type'] ?? $resourceType));
        $deliveryType = strtolower((string) ($response['type'] ?? 'authenticated'));

        return new VerifiedReviewAsset(
            publicId: (string) ($response['public_id'] ?? $intent->provider_asset_key),
            assetId: (string) ($response['asset_id'] ?? ''),
            resourceType: $verifiedResourceType,
            deliveryType: $deliveryType,
            format: $format,
            mimeType: $this->mimeTypeFor($verifiedResourceType, $format),
            bytes: (int) ($response['bytes'] ?? 0),
            width: isset($response['width']) ? (int) $response['width'] : null,
            height: isset($response['height']) ? (int) $response['height'] : null,
            durationSeconds: isset($response['duration']) ? (float) $response['duration'] : null,
        );
    }

    public function signedDeliveryUrl(ReviewMedia $media, int $ttlSeconds): SignedMediaUrl
    {
        $expiresAt = CarbonImmutable::now()->addSeconds(max(60, $ttlSeconds));
        $cloudinary = $this->client();

        $url = $cloudinary->uploadApi()->privateDownloadUrl(
            $media->storage_path,
            $media->format,
            [
                'resource_type' => $media->resource_type,
                'type' => $media->delivery_type,
                'attachment' => false,
                'expires_at' => $expiresAt->getTimestamp(),
            ],
        );

        return new SignedMediaUrl(
            url: $url,
            expiresAt: $expiresAt,
        );
    }

    public function delete(string $publicId, string $resourceType, string $deliveryType): void
    {
        $this->mediaStorage->delete($publicId, $resourceType, $deliveryType);
    }

    private function mimeTypeFor(string $resourceType, string $format): string
    {
        return match ($format) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            default => $resourceType === 'video' ? "video/{$format}" : "image/{$format}",
        };
    }

    private function client(): Cloudinary
    {
        $url = trim((string) config('media.cloudinary_url'));

        while (str_starts_with($url, 'CLOUDINARY_URL=')) {
            $url = trim(substr($url, 15));
        }

        if ($url === '') {
            throw new RuntimeException('Cloudinary credentials are not configured.');
        }

        return new Cloudinary($url);
    }
}
