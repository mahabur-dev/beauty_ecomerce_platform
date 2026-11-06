<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Actions\ManageProductVariants;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Catalog\IndexProductsRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreVariantRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateVariantRequest;
use App\Http\Resources\Api\V1\ProductVariantResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class ProductVariantController extends Controller
{
    public function store(StoreVariantRequest $request, Product $product, ManageProductVariants $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        return (new ProductVariantResource($manager->create($actor, $product, $payload, $request->ip())))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(
        UpdateVariantRequest $request,
        Product $product,
        ProductVariant $variant,
        ManageProductVariants $manager,
    ): ProductVariantResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        return new ProductVariantResource($manager->update($actor, $product, $variant, $payload, $request->ip()));
    }

    public function destroy(
        IndexProductsRequest $request,
        Product $product,
        ProductVariant $variant,
        ManageProductVariants $manager,
    ): Response {
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $product, $variant, $request->ip());

        return response()->noContent();
    }
}
