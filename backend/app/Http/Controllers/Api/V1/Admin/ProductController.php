<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Actions\ManageProducts;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Services\ProductAccess;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Catalog\IndexProductsRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreProductRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateProductRequest;
use App\Http\Resources\Api\V1\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class ProductController extends Controller
{
    public function index(IndexProductsRequest $request): AnonymousResourceCollection
    {
        /** @var User $actor */
        $actor = $request->user();
        $query = Product::query()->with(['brand', 'primaryCategory.parent', 'variants.attributeValues.attribute', 'images']);

        if (! $actor->hasRole(RoleCode::SuperAdmin)) {
            $query->where('vendor_id', $actor->vendor_id);
        }
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhereHas('variants', fn ($variantQuery) => $variantQuery->where('sku', 'like', "%{$search}%")));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->integer('brand_id'));
        }
        if ($request->filled('category_id')) {
            $category = Category::query()->find($request->integer('category_id'));

            if ($category !== null && $category->parent_id === null) {
                $query->whereHas('primaryCategory', fn ($builder) => $builder->where('parent_id', $category->getKey()));
            } elseif ($category !== null) {
                $query->where('primary_category_id', $category->getKey());
            }
        }

        match ($request->string('trash', 'without')->toString()) {
            'with' => $query->withTrashed(),
            'only' => $query->onlyTrashed(),
            default => null,
        };

        return ProductResource::collection(
            $query->latest('id')->paginate($request->integer('per_page', 20)),
        );
    }

    public function store(StoreProductRequest $request, ManageProducts $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        return (new ProductResource($manager->create($actor, $payload, $request->ip())))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Product $product, ProductAccess $access): ProductResource
    {
        /** @var User $actor */
        $actor = request()->user();
        $access->authorize($actor, $product);

        return new ProductResource($product->load($this->relations()));
    }

    public function update(UpdateProductRequest $request, Product $product, ManageProducts $manager): ProductResource
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array<string, mixed> $payload */
        $payload = $request->validated();

        return new ProductResource($manager->update($actor, $product, $payload, $request->ip()));
    }

    public function destroy(IndexProductsRequest $request, Product $product, ManageProducts $manager): Response
    {
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $product, $request->ip());

        return response()->noContent();
    }

    public function restore(IndexProductsRequest $request, int $product, ManageProducts $manager): ProductResource
    {
        /** @var User $actor */
        $actor = $request->user();

        return new ProductResource($manager->restore($actor, $product, $request->ip()));
    }

    /** @return list<string> */
    private function relations(): array
    {
        return ['vendor', 'brand', 'primaryCategory.parent', 'variants.attributeValues.attribute', 'images'];
    }
}
