<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Domain\Catalog\Models\Category;
use App\Domain\Shared\Enums\RecordStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\IndexPublicCategoriesRequest;
use App\Http\Resources\Api\V1\PublicCategoryResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PublicCategoryController extends Controller
{
    public function index(IndexPublicCategoriesRequest $request): AnonymousResourceCollection
    {
        $query = Category::query()
            ->whereNull('parent_id')
            ->where('status', RecordStatus::Active->value)
            ->with(['children' => fn ($children) => $children
                ->where('status', RecordStatus::Active->value)
                ->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')->orderBy('id');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search')->toString().'%');
        }

        return PublicCategoryResource::collection(
            $query->paginate($request->integer('per_page', 20)),
        );
    }

    public function show(string $slug): PublicCategoryResource
    {
        $category = Category::query()
            ->whereNull('parent_id')
            ->where('slug', $slug)
            ->where('status', RecordStatus::Active->value)
            ->with(['children' => fn ($children) => $children
                ->where('status', RecordStatus::Active->value)
                ->orderBy('sort_order')->orderBy('id')])
            ->firstOrFail();

        return new PublicCategoryResource($category);
    }

    public function subcategories(string $slug): AnonymousResourceCollection
    {
        $category = Category::query()
            ->whereNull('parent_id')
            ->where('slug', $slug)
            ->where('status', RecordStatus::Active->value)
            ->firstOrFail();

        return PublicCategoryResource::collection(
            $category->children()->where('status', RecordStatus::Active->value)
                ->orderBy('sort_order')->orderBy('id')->paginate(100),
        );
    }

    public function showSubcategory(string $slug): PublicCategoryResource
    {
        $subcategory = Category::query()
            ->whereNotNull('parent_id')
            ->where('slug', $slug)
            ->where('status', RecordStatus::Active->value)
            ->whereHas('parent', fn ($parent) => $parent->where('status', RecordStatus::Active->value))
            ->with('parent')
            ->firstOrFail();

        return new PublicCategoryResource($subcategory);
    }
}
