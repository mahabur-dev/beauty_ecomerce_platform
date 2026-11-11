<?php

namespace Database\Factories;

use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Enums\ReviewMediaStatus;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<ReviewMedia> */
final class ReviewMediaFactory extends Factory
{
    protected $model = ReviewMedia::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $id = (string) Str::uuid();

        return [
            'review_id' => ProductReview::factory(),
            'kind' => ReviewMediaKind::Image,
            'provider' => 'cloudinary',
            'storage_path' => 'tests/reviews/'.$id,
            'asset_id' => $id,
            'resource_type' => 'image',
            'delivery_type' => 'authenticated',
            'format' => 'jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 120_000,
            'width' => 1000,
            'height' => 1000,
            'duration_seconds' => null,
            'sort_order' => 0,
            'status' => ReviewMediaStatus::Ready,
            'video_slot' => null,
        ];
    }

    public function video(): static
    {
        return $this->state(fn (): array => [
            'kind' => ReviewMediaKind::Video,
            'resource_type' => 'video',
            'format' => 'mp4',
            'mime_type' => 'video/mp4',
            'bytes' => 2_500_000,
            'width' => 1280,
            'height' => 720,
            'duration_seconds' => 12.5,
            'video_slot' => 1,
        ]);
    }
}
