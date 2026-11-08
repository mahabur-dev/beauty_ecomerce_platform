<?php

namespace App\Domain\Catalog\Queries;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Domain\Shared\Enums\RecordStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use stdClass;

final class AdminCatalogOverview
{
    /** @return array<string, array<string, int>> */
    public function summary(User $actor): array
    {
        $productCounts = $this->productQuery($actor)
            ->toBase()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $categoryCounts = Category::query()
            ->toBase()
            ->selectRaw("CASE WHEN parent_id IS NULL THEN 'categories' ELSE 'subcategories' END as entity_type")
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('entity_type', 'status')
            ->get();

        return [
            'products' => $this->statusCounts($productCounts, [
                ProductStatus::Active->value,
                ProductStatus::Draft->value,
                ProductStatus::Inactive->value,
            ]),
            'categories' => $this->categoryStatusCounts($categoryCounts, 'categories'),
            'subcategories' => $this->categoryStatusCounts($categoryCounts, 'subcategories'),
        ];
    }

    /**
     * @return array{
     *   categories: Collection<int, Category>,
     *   subcategories: Collection<int, Category>,
     *   brands: Collection<int, Brand>
     * }
     */
    public function options(): array
    {
        $categories = Category::query()
            ->whereNull('parent_id')
            ->where('status', RecordStatus::Active->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $subcategories = Category::query()
            ->whereNotNull('parent_id')
            ->where('status', RecordStatus::Active->value)
            ->whereHas('parent', fn (Builder $query) => $query->where('status', RecordStatus::Active->value))
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $brands = Brand::query()
            ->where('status', RecordStatus::Active->value)
            ->orderBy('name')
            ->get();

        return compact('categories', 'subcategories', 'brands');
    }

    /** @return Builder<Product> */
    private function productQuery(User $actor): Builder
    {
        $query = Product::query();

        if (! $actor->hasRole(RoleCode::SuperAdmin)) {
            $query->where('vendor_id', $actor->vendor_id);
        }

        return $query;
    }

    /**
     * @param  Collection<string, int|string>  $counts
     * @param  list<string>  $statuses
     * @return array<string, int>
     */
    private function statusCounts(Collection $counts, array $statuses): array
    {
        $result = ['total' => 0];

        foreach ($statuses as $status) {
            $count = (int) $counts->get($status, 0);
            $result[$status] = $count;
            $result['total'] += $count;
        }

        return $result;
    }

    /**
     * @param  Collection<int, stdClass>  $counts
     * @return array<string, int>
     */
    private function categoryStatusCounts(Collection $counts, string $entityType): array
    {
        $byStatus = $counts
            ->where('entity_type', $entityType)
            ->pluck('aggregate', 'status');

        return $this->statusCounts($byStatus, [
            RecordStatus::Active->value,
            RecordStatus::Inactive->value,
        ]);
    }
}
