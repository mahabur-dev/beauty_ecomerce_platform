<?php

namespace App\Domain\Review\Data;

final readonly class ReviewRatingSummary
{
    /**
     * @param  array<int|string, int>  $distribution
     */
    public function __construct(
        public float $averageRating,
        public int $totalReviews,
        public array $distribution,
    ) {}

    /** @return array{average_rating: float, total_reviews: int, distribution: array<int|string, int>} */
    public function toArray(): array
    {
        return [
            'average_rating' => $this->averageRating,
            'total_reviews' => $this->totalReviews,
            'distribution' => $this->distribution,
        ];
    }
}
