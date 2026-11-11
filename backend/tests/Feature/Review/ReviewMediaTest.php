<?php

namespace Tests\Feature\Review;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Contracts\ReviewMediaStorage;
use App\Domain\Review\Data\SignedMediaUrl;
use App\Domain\Review\Data\SignedReviewUpload;
use App\Domain\Review\Data\VerifiedReviewAsset;
use App\Domain\Review\Enums\ReviewMediaKind;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Enums\ReviewUploadIntentStatus;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Jobs\DeleteMediaAsset;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ReviewMediaTest extends TestCase
{
    use RefreshDatabase;

    private FakeReviewMediaStorage $storage;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);
        $this->storage = new FakeReviewMediaStorage;
        $this->app->instance(ReviewMediaStorage::class, $this->storage);
    }

    public function test_signed_image_upload_limits_owner_only_delivery_and_approval_reset(): void
    {
        Bus::fake();

        $owner = $this->createCustomer('Owner');
        $other = $this->createCustomer('Other');
        $review = $this->createReview($owner, ReviewStatus::Approved);

        $this->actingAs($other)
            ->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
                'kind' => 'image',
                'format' => 'jpg',
                'mime_type' => 'image/jpeg',
                'bytes' => 100_000,
            ])->assertForbidden();

        $this->actingAs($owner);

        // Enforce max 5 MB image limit and allowed format/mime rules.
        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'image',
            'format' => 'jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => (5 * 1024 * 1024) + 1,
        ])->assertUnprocessable()->assertJsonPath('title', 'Media size limit exceeded');

        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'image',
            'format' => 'gif',
            'mime_type' => 'image/gif',
            'bytes' => 50_000,
        ])->assertUnprocessable()->assertJsonPath('title', 'Unsupported media format');

        // Upload 5 valid images up to limit. (Clear rate limiter bucket so negative validation checks above don't count toward 5-image quota.)
        Cache::clear();
        $attachedIds = [];
        for ($index = 0; $index < 5; $index++) {
            $intentResponse = $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
                'kind' => 'image',
                'format' => 'webp',
                'mime_type' => 'image/webp',
                'bytes' => 250_000,
            ]);
            $intentResponse->assertCreated()
                ->assertJsonPath('data.upload.fields.type', 'authenticated')
                ->assertJsonPath('data.max_bytes', 5 * 1024 * 1024);

            $token = (string) $intentResponse->json('data.intent_token');

            $finalized = $this->postJson("/api/v1/reviews/{$review->getKey()}/media/finalize", [
                'token' => $token,
                'sort_order' => $index,
            ]);
            $finalized->assertCreated()
                ->assertJsonPath('data.kind', 'image')
                ->assertJsonPath('data.status', 'ready');

            $attachedIds[] = (int) $finalized->json('data.id');
        }

        // Attaching media to an approved review reverts it to pending.
        $review->refresh();
        self::assertSame(ReviewStatus::Pending, $review->status);
        self::assertNull($review->published_at);

        // 6th image must be blocked.
        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'image',
            'format' => 'png',
            'mime_type' => 'image/png',
            'bytes' => 100_000,
        ])->assertUnprocessable()->assertJsonPath('title', 'Media limit reached');

        // Replaying already-finalized intent returns 409.
        $reusedToken = (string) ReviewUploadIntent::query()->firstOrFail()->token;
        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/finalize", [
            'token' => $reusedToken,
        ])->assertStatus(409);

        // Owner can refresh signed URL for pending media; other customer is forbidden; public list omits pending review.
        $firstMediaId = $attachedIds[0];
        $this->getJson("/api/v1/reviews/{$review->getKey()}/media/{$firstMediaId}/url")
            ->assertOk()
            ->assertJsonPath('data.id', $firstMediaId);

        $this->actingAs($other)
            ->getJson("/api/v1/reviews/{$review->getKey()}/media/{$firstMediaId}/url")
            ->assertForbidden();

        $this->getJson("/api/v1/products/{$review->product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Owner deletes one image -> dispatches DeleteMediaAsset and opens slot again.
        $this->actingAs($owner)
            ->deleteJson("/api/v1/reviews/{$review->getKey()}/media/{$firstMediaId}")
            ->assertNoContent();
        Bus::assertDispatched(DeleteMediaAsset::class);
    }

    public function test_video_feature_flag_duration_limit_server_verification_cleanup_and_cancel_retry(): void
    {
        config(['reviews.video.enabled' => false]);
        $owner = $this->createCustomer('VideoCustomer');
        $review = $this->createReview($owner);

        $this->actingAs($owner);

        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'video',
            'format' => 'mp4',
            'mime_type' => 'video/mp4',
            'bytes' => 2_000_000,
            'duration_seconds' => 15,
        ])->assertUnprocessable()->assertJsonPath('title', 'Video uploads disabled');

        config(['reviews.video.enabled' => true]);

        // Reject >30s video pre-upload.
        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'video',
            'format' => 'mp4',
            'mime_type' => 'video/mp4',
            'bytes' => 5_000_000,
            'duration_seconds' => 31,
        ])->assertUnprocessable()->assertJsonPath('title', 'Video duration exceeded');

        // Create intent then cancel it to test retry flow.
        $cancelable = $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'video',
            'format' => 'mp4',
            'mime_type' => 'video/mp4',
            'bytes' => 5_000_000,
            'duration_seconds' => 20,
        ])->assertCreated();
        $cancelToken = (string) $cancelable->json('data.intent_token');

        $this->deleteJson("/api/v1/reviews/{$review->getKey()}/media/intents/{$cancelToken}")
            ->assertNoContent();

        // Now simulate tampered client upload: Cloudinary reports 45s duration -> backend rejects & deletes asset.
        $tampered = $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'video',
            'format' => 'mp4',
            'mime_type' => 'video/mp4',
            'bytes' => 5_000_000,
            'duration_seconds' => 10,
        ])->assertCreated();
        $tamperedToken = (string) $tampered->json('data.intent_token');
        $this->storage->durationOverride = 45.0;

        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/finalize", [
            'token' => $tamperedToken,
        ])->assertUnprocessable()->assertJsonPath('title', 'Video duration exceeded');

        self::assertCount(1, $this->storage->deletedPublicIds);
        $this->assertDatabaseHas('review_upload_intents', [
            'token' => $tamperedToken,
            'status' => ReviewUploadIntentStatus::Cancelled->value,
        ]);

        // Valid 25s mp4 succeeds; second video fails at 1-video limit.
        $this->storage->durationOverride = 25.0;
        $valid = $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'video',
            'format' => 'mp4',
            'mime_type' => 'video/mp4',
            'bytes' => 10_000_000,
            'duration_seconds' => 25,
        ])->assertCreated();

        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/finalize", [
            'token' => (string) $valid->json('data.intent_token'),
        ])->assertCreated()->assertJsonPath('data.kind', 'video');

        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'video',
            'format' => 'webm',
            'mime_type' => 'video/webm',
            'bytes' => 5_000_000,
            'duration_seconds' => 10,
        ])->assertUnprocessable()->assertJsonPath('title', 'Media limit reached');
    }

    public function test_expired_upload_intent_is_rejected_with_conflict(): void
    {
        $owner = $this->createCustomer('ExpiredUser');
        $review = $this->createReview($owner);

        $intent = ReviewUploadIntent::factory()->create([
            'review_id' => $review->getKey(),
            'user_id' => $owner->getKey(),
            'expires_at' => now()->subMinute(),
        ]);

        $this->actingAs($owner)
            ->postJson("/api/v1/reviews/{$review->getKey()}/media/finalize", [
                'token' => $intent->token,
            ])->assertStatus(409)
            ->assertJsonPath('title', 'Intent expired');
    }

    public function test_review_media_rate_limiter_enforces_ten_requests_per_minute(): void
    {
        $owner = $this->createCustomer('RateLimited');
        $review = $this->createReview($owner);
        $this->actingAs($owner);

        for ($i = 0; $i < 10; $i++) {
            $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
                'kind' => 'image',
                'format' => 'gif',
                'mime_type' => 'image/gif',
                'bytes' => 1000,
            ])->assertUnprocessable();
        }

        $this->postJson("/api/v1/reviews/{$review->getKey()}/media/intents", [
            'kind' => 'image',
            'format' => 'jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 1000,
        ])->assertStatus(429)
            ->assertJsonPath('title', 'Rate limit exceeded');
    }

    private function createReview(User $owner, ReviewStatus $status = ReviewStatus::Pending): ProductReview
    {
        $product = Product::factory()->create(['status' => ProductStatus::Active]);
        $product->categories()->sync([$product->primary_category_id]);
        ProductVariant::factory()->create(['product_id' => $product->getKey(), 'is_default' => true, 'is_active' => true]);
        ProductImage::factory()->create(['product_id' => $product->getKey(), 'is_primary' => true]);

        return ProductReview::factory()->create([
            'product_id' => $product->getKey(),
            'user_id' => $owner->getKey(),
            'vendor_id' => $product->vendor_id,
            'status' => $status,
            'published_at' => $status === ReviewStatus::Approved ? now() : null,
        ]);
    }

    private function createCustomer(string $name): User
    {
        $user = User::factory()->create(['name' => $name]);
        $role = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $user->roles()->attach($role, ['assigned_at' => now()]);

        return $user;
    }
}

final class FakeReviewMediaStorage implements ReviewMediaStorage
{
    public ?float $durationOverride = null;

    /** @var list<string> */
    public array $deletedPublicIds = [];

    public function createSignedUpload(ReviewUploadIntent $intent): SignedReviewUpload
    {
        $resourceType = $intent->kind === ReviewMediaKind::Video ? 'video' : 'image';

        return new SignedReviewUpload(
            uploadUrl: "https://api.cloudinary.com/v1_1/test/{$resourceType}/upload",
            method: 'POST',
            fields: [
                'public_id' => $intent->provider_asset_key,
                'type' => 'authenticated',
                'signature' => 'fake-signature',
            ],
        );
    }

    public function verifyUploadedAsset(ReviewUploadIntent $intent): VerifiedReviewAsset
    {
        $isVideo = $intent->kind === ReviewMediaKind::Video;

        return new VerifiedReviewAsset(
            publicId: $intent->provider_asset_key,
            assetId: (string) Str::uuid(),
            resourceType: $isVideo ? 'video' : 'image',
            deliveryType: 'authenticated',
            format: $isVideo ? 'mp4' : 'webp',
            mimeType: $isVideo ? 'video/mp4' : 'image/webp',
            bytes: $isVideo ? 10_000_000 : 250_000,
            width: 1080,
            height: 1080,
            durationSeconds: $isVideo ? ($this->durationOverride ?? 15.0) : null,
        );
    }

    public function signedDeliveryUrl(ReviewMedia $media, int $ttlSeconds): SignedMediaUrl
    {
        $expiresAt = CarbonImmutable::now()->addSeconds($ttlSeconds);

        return new SignedMediaUrl(
            url: "https://api.cloudinary.com/v1_1/test/{$media->resource_type}/download?public_id={$media->storage_path}&type=authenticated&expires_at={$expiresAt->getTimestamp()}",
            expiresAt: $expiresAt,
        );
    }

    public function delete(string $publicId, string $resourceType, string $deliveryType): void
    {
        $this->deletedPublicIds[] = $publicId;
    }
}
