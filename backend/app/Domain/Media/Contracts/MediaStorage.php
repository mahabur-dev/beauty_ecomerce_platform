<?php

namespace App\Domain\Media\Contracts;

use App\Domain\Media\Data\UploadedAsset;
use Illuminate\Http\UploadedFile;

interface MediaStorage
{
    public function uploadImage(UploadedFile $file, string $folder): UploadedAsset;

    public function delete(string $publicId, string $resourceType, string $deliveryType): void;
}
