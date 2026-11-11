<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProductReview> */
final class ProductReviewFactory extends Factory
{
    protected $model = ProductReview::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'user_id' => User::factory(),
            'vendor_id' => Vendor::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'title' => fake()->sentence(5),
            'body' => fake()->paragraph(2),
            'status' => ReviewStatus::Pending,
            'verified_purchase' => false,
            'submitted_at' => now(),
            'published_at' => null,
            'moderated_by_user_id' => null,
            'moderated_at' => null,
            'moderation_reason' => null,
            'lock_version' => 1,
            'active_slot' => 1,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (): array => [
            'status' => ReviewStatus::Approved,
            'published_at' => now(),
            'moderated_at' => now(),
            'moderation_reason' => 'Approved by moderation.',
        ]);
    }
}
