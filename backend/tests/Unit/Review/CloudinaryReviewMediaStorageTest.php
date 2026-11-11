<?php

namespace Tests\Unit\Review;

use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Media\Data\UploadedAsset;
use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Infrastructure\Media\CloudinaryReviewMediaStorage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

final class CloudinaryReviewMediaStorageTest extends TestCase
{
    public function test_it_signs_private_authenticated_uploads_and_expirable_delivery_urls(): void
    {
        config(['media.cloudinary_url' => 'cloudinary://test_key:test_secret@demo_cloud']);

        $storage = new CloudinaryReviewMediaStorage(new class implements MediaStorage
        {
            public function uploadImage(UploadedFile $file, string $folder): UploadedAsset
            {
                return new UploadedAsset('', '', 'image', 'upload', '', 'jpg', 1, 1, 1);
            }

            public function delete(string $publicId, string $resourceType, string $deliveryType): void {}
        });

        $intent = new ReviewUploadIntent;
        $intent->forceFill([
            'provider_asset_key' => 'beauty-commerce/local/reviews/1/asset-uuid',
            'kind' => ReviewMediaKind::Image,
        ]);

        $signedUpload = $storage->createSignedUpload($intent);
        self::assertSame('https://api.cloudinary.com/v1_1/demo_cloud/image/upload', $signedUpload->uploadUrl);
        self::assertSame('authenticated', $signedUpload->fields['type']);
        self::assertSame('beauty-commerce/local/reviews/1/asset-uuid', $signedUpload->fields['public_id']);
        self::assertSame('test_key', $signedUpload->fields['api_key']);
        self::assertNotEmpty($signedUpload->fields['signature']);
        self::assertNotEmpty($signedUpload->fields['timestamp']);

        $media = new ReviewMedia;
        $media->forceFill([
            'kind' => ReviewMediaKind::Image,
            'storage_path' => 'beauty-commerce/local/reviews/1/asset-uuid',
            'resource_type' => 'image',
            'delivery_type' => 'authenticated',
            'format' => 'webp',
        ]);

        $delivery = $storage->signedDeliveryUrl($media, 300);
        self::assertStringStartsWith('https://api.cloudinary.com/v1_1/demo_cloud/image/download?', $delivery->url);
        self::assertStringContainsString('type=authenticated', $delivery->url);
        self::assertStringContainsString('signature=', $delivery->url);
        self::assertStringContainsString('expires_at=', $delivery->url);
        self::assertTrue($delivery->expiresAt->isFuture());
    }
}
