<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Catalog\Actions\ManageCategories;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Category;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\Catalog\IndexCatalogEntitiesRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\StoreSubcategoryRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateCategoryRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UpdateSubcategoryRequest;
use App\Http\Requests\Api\V1\Admin\Catalog\UploadCategoryImageRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

final class CategoryController extends Controller
{
    public function indexRoots(IndexCatalogEntitiesRequest $request): AnonymousResourceCollection
    {
        $query = Category::query()
            ->whereNull('parent_id')
            ->withCount('children');
        $this->applyFilters($query, $request);

        return CategoryResource::collection(
            $query->orderBy('sort_order')->orderBy('id')->paginate($request->integer('per_page', 20)),
        );
    }

    public function storeRoot(StoreCategoryRequest $request, ManageCategories $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{name: string, slug: string, description?: string|null, status?: string, sort_order?: int} $attributes */
        $attributes = $request->safe()->except(['image']);
        $image = $request->file('image');
        $category = $manager->createRoot(
            $actor,
            $attributes,
            $request->ip(),
            $image instanceof UploadedFile ? $image : null,
        );

        return (new CategoryResource($category->loadCount('children')))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function showRoot(Category $category): CategoryResource
    {
        $this->assertRoot($category);

        return new CategoryResource($category->load(['children'])->loadCount(['children', 'products']));
    }

    public function updateRoot(
        UpdateCategoryRequest $request,
        Category $category,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{name?: string, slug?: string, description?: string|null, status?: string, sort_order?: int} $attributes */
        $attributes = $request->safe()->except(['image', 'remove_image']);
        $image = $request->file('image');
        $updated = $manager->updateRoot(
            $actor,
            $category,
            $attributes,
            $request->ip(),
            $image instanceof UploadedFile ? $image : null,
            $request->boolean('remove_image'),
        );

        return new CategoryResource($updated->loadCount('children'));
    }

    public function uploadRootImage(
        UploadCategoryImageRequest $request,
        Category $category,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var UploadedFile $image */
        $image = $request->file('image');
        $updated = $manager->uploadImage($actor, $category, $image, true, $request->ip());

        return new CategoryResource($updated->loadCount('children'));
    }

    public function destroyRootImage(
        IndexCatalogEntitiesRequest $request,
        Category $category,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();
        $updated = $manager->deleteImage($actor, $category, true, $request->ip());

        return new CategoryResource($updated->loadCount('children'));
    }

    public function destroyRoot(
        IndexCatalogEntitiesRequest $request,
        Category $category,
        ManageCategories $manager,
    ): Response {
        $this->assertRoot($category);
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $category, $request->ip());

        return response()->noContent();
    }

    public function restoreRoot(
        IndexCatalogEntitiesRequest $request,
        int $category,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();

        return new CategoryResource($manager->restore($actor, $category, true, $request->ip()));
    }

    public function indexChildren(IndexCatalogEntitiesRequest $request): AnonymousResourceCollection
    {
        $query = Category::query()
            ->whereNotNull('parent_id')
            ->with('parent')
            ->withCount('products');

        if ($request->filled('category_id')) {
            $query->where('parent_id', $request->integer('category_id'));
        }

        $this->applyFilters($query, $request);

        return CategoryResource::collection(
            $query->orderBy('parent_id')->orderBy('sort_order')->orderBy('id')
                ->paginate($request->integer('per_page', 20)),
        );
    }

    public function storeChild(StoreSubcategoryRequest $request, ManageCategories $manager): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{name: string, slug: string, description?: string|null, status?: string, sort_order?: int} $attributes */
        $attributes = $request->safe()->except(['category_id', 'image']);
        $image = $request->file('image');
        $subcategory = $manager->createChild(
            $actor,
            $request->integer('category_id'),
            $attributes,
            $request->ip(),
            $image instanceof UploadedFile ? $image : null,
        );

        return (new CategoryResource($subcategory->load('parent')->loadCount('products')))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function showChild(Category $subcategory): CategoryResource
    {
        $this->assertChild($subcategory);

        return new CategoryResource($subcategory->load('parent')->loadCount('products'));
    }

    public function updateChild(
        UpdateSubcategoryRequest $request,
        Category $subcategory,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var array{name?: string, slug?: string, description?: string|null, status?: string, sort_order?: int} $attributes */
        $attributes = $request->safe()->except(['category_id', 'image', 'remove_image']);
        $image = $request->file('image');
        $updated = $manager->updateChild(
            $actor,
            $subcategory,
            $request->filled('category_id') ? $request->integer('category_id') : null,
            $attributes,
            $request->ip(),
            $image instanceof UploadedFile ? $image : null,
            $request->boolean('remove_image'),
        );

        return new CategoryResource($updated->load('parent')->loadCount('products'));
    }

    public function uploadChildImage(
        UploadCategoryImageRequest $request,
        Category $subcategory,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();
        /** @var UploadedFile $image */
        $image = $request->file('image');
        $updated = $manager->uploadImage($actor, $subcategory, $image, false, $request->ip());

        return new CategoryResource($updated->load('parent')->loadCount('products'));
    }

    public function destroyChildImage(
        IndexCatalogEntitiesRequest $request,
        Category $subcategory,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();
        $updated = $manager->deleteImage($actor, $subcategory, false, $request->ip());

        return new CategoryResource($updated->load('parent')->loadCount('products'));
    }

    public function destroyChild(
        IndexCatalogEntitiesRequest $request,
        Category $subcategory,
        ManageCategories $manager,
    ): Response {
        $this->assertChild($subcategory);
        /** @var User $actor */
        $actor = $request->user();
        $manager->delete($actor, $subcategory, $request->ip());

        return response()->noContent();
    }

    public function restoreChild(
        IndexCatalogEntitiesRequest $request,
        int $subcategory,
        ManageCategories $manager,
    ): CategoryResource {
        /** @var User $actor */
        $actor = $request->user();

        return new CategoryResource($manager->restore($actor, $subcategory, false, $request->ip()));
    }

    /** @param Builder<Category> $query */
    private function applyFilters(Builder $query, IndexCatalogEntitiesRequest $request): void
    {
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
    }

    private function assertRoot(Category $category): void
    {
        if ($category->parent_id !== null) {
            throw new CatalogRuleException('The selected record is not a root category.', 404, 'Category not found');
        }
    }

    private function assertChild(Category $category): void
    {
        if ($category->parent_id === null) {
            throw new CatalogRuleException('The selected record is not a subcategory.', 404, 'Subcategory not found');
        }
    }
}
