<?php

namespace Database\Factories;

use App\Domain\Identity\Models\User;
use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Enums\ReviewUploadIntentStatus;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewUploadIntent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<ReviewUploadIntent> */
final class ReviewUploadIntentFactory extends Factory
{
    protected $model = ReviewUploadIntent::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $uuid = (string) Str::uuid();

        return [
            'token' => $uuid,
            'review_id' => ProductReview::factory(),
            'user_id' => User::factory(),
            'provider' => 'cloudinary',
            'provider_asset_key' => 'tests/reviews/intents/'.$uuid,
            'kind' => ReviewMediaKind::Image,
            'status' => ReviewUploadIntentStatus::Pending,
            'expires_at' => now()->addMinutes(10),
            'finalized_at' => null,
        ];
    }
}
