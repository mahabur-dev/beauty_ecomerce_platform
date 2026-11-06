<?php

namespace App\Domain\Catalog\Queries;

use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final readonly class GroupedCatalogQuery
{
    public function __construct(private PublicProductQuery $products) {}

    /**
     * @return array{groups: LengthAwarePaginator<int, Category>, products: Collection<int, Product>}
     */
    public function execute(int $groupsPerPage, ?string $categorySlug): array
    {
        $groupsQuery = Category::query()
            ->whereNotNull('parent_id')
            ->where('status', RecordStatus::Active->value)
            ->whereHas('parent', fn ($query) => $query
                ->where('status', RecordStatus::Active->value)
                ->when($categorySlug !== null, fn ($parent) => $parent->where('slug', $categorySlug)))
            ->whereHas('primaryProducts', fn ($productQuery) => $this->products->applyVisibility($productQuery))
            ->with('parent:id,parent_id,name,slug')
            ->orderBy('sort_order')
            ->orderBy('id');

        $groups = $groupsQuery->paginate($groupsPerPage);
        $groupIds = $groups->getCollection()->modelKeys();

        if ($groupIds === []) {
            return ['groups' => $groups, 'products' => collect()];
        }

        $ranked = $this->products->visible()
            ->whereIn('primary_category_id', $groupIds)
            ->select(['products.id', 'products.primary_category_id'])
            ->selectRaw('ROW_NUMBER() OVER (PARTITION BY products.primary_category_id ORDER BY products.created_at DESC, products.id DESC) AS group_position');
        $ids = DB::query()->fromSub($ranked->toBase(), 'ranked_products')
            ->where('group_position', '<=', 10)
            ->pluck('id')->map(fn ($id): int => (int) $id)->all();

        $products = Product::query()->whereIn('id', $ids)
            ->with($this->products->summaryRelations())
            ->get()
            ->sortBy(function (Product $product) use ($ids): int {
                $position = array_search((int) $product->getKey(), $ids, true);

                return $position === false ? PHP_INT_MAX : (int) $position;
            })
            ->values();

        return ['groups' => $groups, 'products' => $products];
    }
}
