<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Actions\ManageProductImages;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Catalog\IndexProductsRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateProductImageRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UploadProductImageRequest;
use App\Http\Resources\Api\V1\ProductImageResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

final class ProductImageController extends Controller
{
    public function store(UploadProductImageRequest $request, Product $product, ManageProductImages $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var UploadedFile $file */
        $file = $request->file('image');
        /** @var array{product_variant_id?: int|null, alt_text?: string|null, sort_order?: int, is_primary?: bool} $metadata */
        $metadata = $request->safe()->except('image');
        $image = $manager->upload($actor, $product, $file, $metadata, $request->ip());

        return (new ProductImageResource($image))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpdateProductImageRequest $request,
        Product $product,
        ProductImage $image,
        ManageProductImages $manager,
    ): ProductImageResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{product_variant_id?: int|null, alt_text?: string|null, sort_order?: int, is_primary?: bool} $metadata */
        $metadata = $request->validated();

        return new ProductImageResource($manager->update($actor, $product, $image, $metadata, $request->ip()));
    }

    public function destroy(
        IndexProductsRequest $request,
        Product $product,
        ProductImage $image,
        ManageProductImages $manager,
    ): Response {
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $product, $image, $request->ip());

        return response()->noContent();
    }
}
