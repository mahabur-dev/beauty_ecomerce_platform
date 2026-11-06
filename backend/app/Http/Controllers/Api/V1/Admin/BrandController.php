<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Actions\ManageBrands;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Catalog\IndexCatalogEntitiesRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreBrandRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateBrandRequest;
use App\Http\Resources\Api\V1\BrandResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class BrandController extends Controller
{
    public function index(IndexCatalogEntitiesRequest $request): AnonymousResourceCollection
    {
        $query = Brand::query()->withCount('products');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search')->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        match ($request->string('trash', 'without')->toString()) {
            'with' => $query->withTrashed(),
            'only' => $query->onlyTrashed(),
            default => null,
        };

        return BrandResource::collection(
            $query->orderBy('name')->orderBy('id')->paginate($request->integer('per_page', 20)),
        );
    }

    public function store(StoreBrandRequest $request, ManageBrands $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{name: string, slug: string, status?: string} $attributes */
        $attributes = $request->validated();

        return (new BrandResource($manager->create($actor, $attributes, $request->ip())->loadCount('products')))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Brand $brand): BrandResource
    {
        return new BrandResource($brand->loadCount('products'));
    }

    public function update(UpdateBrandRequest $request, Brand $brand, ManageBrands $manager): BrandResource
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{name?: string, slug?: string, status?: string} $attributes */
        $attributes = $request->validated();

        return new BrandResource($manager->update($actor, $brand, $attributes, $request->ip())->loadCount('products'));
    }

    public function destroy(
        IndexCatalogEntitiesRequest $request,
        Brand $brand,
        ManageBrands $manager,
    ): Response {
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $brand, $request->ip());

        return response()->noContent();
    }

    public function restore(
        IndexCatalogEntitiesRequest $request,
        int $brand,
        ManageBrands $manager,
    ): BrandResource {
        /** @var User $actor */
        $actor = $request->user();

        return new BrandResource($manager->restore($actor, $brand, $request->ip())->loadCount('products'));
    }
}
