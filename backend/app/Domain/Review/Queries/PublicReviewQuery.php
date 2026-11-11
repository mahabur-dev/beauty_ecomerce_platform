<?php

namespace App\Domain\Review\Queries;

use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Queries\PublicProductQuery;
use App\Domain\Review\Data\ReviewRatingSummary;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Models\ProductReview;
use Illuminate\Database\Eloquent\Builder;

final readonly class PublicReviewQuery
{
    public function __construct(
        private PublicProductQuery $products,
    ) {}

    public function visibleProductBySlug(string $slug): Product
    {
        return $this->products->visible()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /**
     * @param  array{rating?: int|null, with_media?: bool|null, sort?: string|null}  $filters
     * @return Builder<ProductReview>
     */
    public function approvedForProduct(Product $product, array $filters = []): Builder
    {
        $query = ProductReview::query()
            ->where('product_id', $product->getKey())
            ->where('status', ReviewStatus::Approved->value)
            ->with([
                'user:id,name',
                'readyMedia',
                'reply.author:id,name',
            ]);

        if (isset($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        if (($filters['with_media'] ?? false) === true) {
            $query->whereHas('readyMedia');
        }

        return match ($filters['sort'] ?? 'newest') {
            'highest' => $query->orderByDesc('rating')->orderByDesc('published_at')->orderByDesc('id'),
            'lowest' => $query->orderBy('rating')->orderByDesc('published_at')->orderByDesc('id'),
            default => $query->orderByDesc('published_at')->orderByDesc('id'),
        };
    }

    public function ratingSummary(Product $product): ReviewRatingSummary
    {
        $counts = ProductReview::query()
            ->where('product_id', $product->getKey())
            ->where('status', ReviewStatus::Approved->value)
            ->selectRaw('rating, COUNT(*) as aggregate')
            ->groupBy('rating')
            ->pluck('aggregate', 'rating');

        $distribution = [];
        $totalReviews = 0;
        $weightedSum = 0;

        for ($stars = 5; $stars >= 1; $stars--) {
            $count = (int) ($counts[$stars] ?? 0);
            $distribution[(string) $stars] = $count;
            $totalReviews += $count;
            $weightedSum += $stars * $count;
        }

        $average = $totalReviews > 0 ? round($weightedSum / $totalReviews, 2) : 0.0;

        return new ReviewRatingSummary(
            averageRating: $average,
            totalReviews: $totalReviews,
            distribution: $distribution,
        );
    }
}
