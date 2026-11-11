<?php

namespace Database\Factories;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewReply;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ReviewReply> */
final class ReviewReplyFactory extends Factory
{
    protected $model = ReviewReply::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'review_id' => ProductReview::factory(),
            'admin_user_id' => User::factory(),
            'body' => fake()->paragraph(),
        ];
    }
}
