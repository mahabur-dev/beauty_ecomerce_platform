<?php

namespace App\Infrastructure\Media;

use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Media\Data\UploadedAsset;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use RuntimeException;

final class CloudinaryMediaStorage implements MediaStorage
{
    public function uploadImage(UploadedFile $file, string $folder): UploadedAsset
    {
        $cloudinary = $this->client();
        $path = $file->getRealPath();

        if ($path === false) {
            throw new RuntimeException('The uploaded image is not readable.');
        }

        $response = $cloudinary->uploadApi()->upload($path, [
            'resource_type' => 'image',
            'folder' => trim($folder, '/'),
            'public_id' => (string) Str::uuid(),
            'overwrite' => false,
            'unique_filename' => false,
        ]);

        return new UploadedAsset(
            publicId: (string) $response['public_id'],
            assetId: (string) $response['asset_id'],
            resourceType: (string) ($response['resource_type'] ?? 'image'),
            deliveryType: (string) ($response['type'] ?? 'upload'),
            secureUrl: (string) $response['secure_url'],
            format: (string) $response['format'],
            bytes: (int) $response['bytes'],
            width: isset($response['width']) ? (int) $response['width'] : null,
            height: isset($response['height']) ? (int) $response['height'] : null,
        );
    }

    public function delete(string $publicId, string $resourceType, string $deliveryType): void
    {
        $response = $this->client()->uploadApi()->destroy($publicId, [
            'resource_type' => $resourceType,
            'type' => $deliveryType,
            'invalidate' => true,
        ]);

        if (! in_array((string) ($response['result'] ?? ''), ['ok', 'not found'], true)) {
            throw new RuntimeException('Cloudinary did not confirm asset deletion.');
        }
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
