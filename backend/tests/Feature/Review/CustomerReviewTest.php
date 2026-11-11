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
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewReply;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Jobs\DeleteMediaAsset;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class CustomerReviewTest extends TestCase
{
    use RefreshDatabase;

    private CustomerFakeReviewMediaStorage $mediaStorage;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);
        $this->mediaStorage = new CustomerFakeReviewMediaStorage;
        $this->app->instance(ReviewMediaStorage::class, $this->mediaStorage);
    }

    public function test_public_reviews_expose_only_approved_reviews_on_visible_products_with_summary_and_bounded_queries(): void
    {
        $visible = $this->createVisibleProduct('radiance-serum');
        $draft = Product::factory()->create(['status' => ProductStatus::Draft, 'slug' => 'hidden-serum']);

        $customerA = $this->createCustomer('Amina');
        $customerB = $this->createCustomer('Farah');
        $customerC = $this->createCustomer('Nadia');
        $admin = $this->createAdmin();

        $approvedHigh = ProductReview::factory()->approved()->create([
            'product_id' => $visible->getKey(),
            'user_id' => $customerA->getKey(),
            'vendor_id' => $visible->vendor_id,
            'rating' => 5,
            'title' => 'Luminous finish',
            'body' => 'Absorbs cleanly without stickiness.',
            'published_at' => now()->subHour(),
            'moderation_reason' => 'Internal moderation note must never leak',
        ]);
        ReviewMedia::factory()->for($approvedHigh, 'review')->create();
        ReviewReply::factory()->create([
            'review_id' => $approvedHigh->getKey(),
            'admin_user_id' => $admin->getKey(),
            'body' => 'Thank you for sharing your routine.',
        ]);

        $approvedMid = ProductReview::factory()->approved()->create([
            'product_id' => $visible->getKey(),
            'user_id' => $customerB->getKey(),
            'vendor_id' => $visible->vendor_id,
            'rating' => 3,
            'title' => 'Decent hydration',
            'published_at' => now(),
        ]);

        // Pending & rejected reviews must never leak publicly.
        ProductReview::factory()->create([
            'product_id' => $visible->getKey(),
            'user_id' => $customerC->getKey(),
            'vendor_id' => $visible->vendor_id,
            'rating' => 1,
            'title' => 'Unmoderated review',
            'status' => ReviewStatus::Pending,
        ]);

        $this->getJson("/api/v1/products/{$draft->slug}/reviews")->assertNotFound();

        DB::flushQueryLog();
        DB::enableQueryLog();
        $response = $this->getJson("/api/v1/products/{$visible->slug}/reviews");
        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $approvedMid->getKey())
            ->assertJsonPath('data.1.id', $approvedHigh->getKey())
            ->assertJsonPath('data.1.author.name', 'Amina')
            ->assertJsonPath('data.1.reply.body', 'Thank you for sharing your routine.')
            ->assertJsonPath('summary.total_reviews', 2)
            ->assertJsonPath('summary.average_rating', 4)
            ->assertJsonPath('summary.distribution.5', 1)
            ->assertJsonPath('summary.distribution.3', 1)
            ->assertJsonPath('summary.distribution.1', 0)
            ->assertJsonMissing(['Unmoderated review', 'Internal moderation note must never leak'])
            ->assertJsonMissingPath('data.1.author.email')
            ->assertJsonMissingPath('data.1.user_id')
            ->assertJsonMissingPath('data.1.moderation_reason');

        self::assertLessThanOrEqual(12, $queryCount, 'Public review listing query count must stay bounded.');

        $this->getJson("/api/v1/products/{$visible->slug}/reviews?rating=5&with_media=true&sort=highest")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approvedHigh->getKey())
            ->assertJsonPath('summary.total_reviews', 2);

        $this->getJson("/api/v1/products/{$visible->slug}/reviews?sort=lowest")
            ->assertOk()
            ->assertJsonPath('data.0.id', $approvedMid->getKey());

        $this->getJson("/api/v1/products/{$visible->slug}/reviews/summary")
            ->assertOk()
            ->assertJsonPath('data.total_reviews', 2);
    }

    public function test_customer_can_create_edit_and_delete_review_and_resubmit_after_deletion(): void
    {
        Bus::fake();

        $product = $this->createVisibleProduct('barrier-cream');
        $customer = $this->createCustomer('Sadia');

        $this->postJson("/api/v1/products/{$product->slug}/reviews", ['rating' => 5])
            ->assertUnauthorized();

        $this->actingAs($customer);

        // Mass-assignment fields must be ignored; review starts as pending with server vendor_id.
        $created = $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
            'title' => 'Restored my barrier',
            'body' => 'Gentle texture and zero fragrance irritation.',
            'status' => 'approved',
            'verified_purchase' => true,
            'vendor_id' => 9999,
            'lock_version' => 99,
        ]);

        $created->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.verified_purchase', false)
            ->assertJsonPath('data.lock_version', 1)
            ->assertJsonPath('data.product.slug', $product->slug);

        $reviewId = (int) $created->json('data.id');
        $this->assertDatabaseHas('product_reviews', [
            'id' => $reviewId,
            'vendor_id' => $product->vendor_id,
            'status' => 'pending',
            'verified_purchase' => false,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'review.submitted',
            'subject_type' => 'product_review',
            'subject_id' => $reviewId,
        ]);

        // Duplicate active review for same customer & product fails with 409.
        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 4,
            'title' => 'Second attempt',
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Duplicate review');

        // Approve the review and confirm it goes live publicly.
        ProductReview::query()->whereKey($reviewId)->update([
            'status' => ReviewStatus::Approved->value,
            'published_at' => now(),
            'moderation_reason' => 'Looks good',
        ]);
        ReviewMedia::factory()->create(['review_id' => $reviewId]);

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Stale lock_version conflict returns 409.
        $this->patchJson("/api/v1/reviews/{$reviewId}", [
            'rating' => 4,
            'lock_version' => 999,
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Version conflict');

        // Customer edit resets approved review back to pending and disappears from public list.
        $updated = $this->patchJson("/api/v1/reviews/{$reviewId}", [
            'rating' => 4,
            'title' => 'Updated review title',
            'body' => 'Still hydrating after four weeks.',
            'lock_version' => 1,
        ]);

        $updated->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.published_at', null)
            ->assertJsonPath('data.moderation_reason', null)
            ->assertJsonPath('data.lock_version', 2);

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('summary.total_reviews', 0);

        $this->getJson("/api/v1/reviews/me?product_slug={$product->slug}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reviewId);

        // Delete review, release active_slot, dispatch media cleanup, and allow fresh submission.
        $this->deleteJson("/api/v1/reviews/{$reviewId}")
            ->assertNoContent();

        Bus::assertDispatched(DeleteMediaAsset::class);
        $this->assertSoftDeleted('product_reviews', ['id' => $reviewId]);
        $this->assertDatabaseHas('product_reviews', [
            'id' => $reviewId,
            'active_slot' => null,
        ]);

        $resubmitted = $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
            'title' => 'Fresh review after deletion',
        ]);
        $resubmitted->assertCreated()
            ->assertJsonPath('data.status', 'pending');
        self::assertNotSame($reviewId, $resubmitted->json('data.id'));
    }

    public function test_idor_and_hidden_review_edit_lock_are_enforced(): void
    {
        $product = $this->createVisibleProduct('niacinamide-drops');
        $owner = $this->createCustomer('Owner');
        $other = $this->createCustomer('Intruder');
        $unverified = User::factory()->unverified()->create();

        $review = ProductReview::factory()->create([
            'product_id' => $product->getKey(),
            'user_id' => $owner->getKey(),
            'vendor_id' => $product->vendor_id,
            'status' => ReviewStatus::Pending,
        ]);

        $this->actingAs($unverified)
            ->postJson("/api/v1/products/{$product->slug}/reviews", ['rating' => 5])
            ->assertForbidden();

        $this->actingAs($other);
        $this->getJson("/api/v1/reviews/{$review->getKey()}")->assertForbidden();
        $this->patchJson("/api/v1/reviews/{$review->getKey()}", ['rating' => 1])->assertForbidden();
        $this->deleteJson("/api/v1/reviews/{$review->getKey()}")->assertForbidden();

        $review->forceFill(['status' => ReviewStatus::Hidden])->save();
        $this->actingAs($owner)
            ->patchJson("/api/v1/reviews/{$review->getKey()}", ['rating' => 2])
            ->assertStatus(409)
            ->assertJsonPath('title', 'Review locked');
    }

    public function test_review_write_rate_limiter_enforces_twenty_requests_per_minute(): void
    {
        $product = $this->createVisibleProduct('soothing-gel');
        $owner = $this->createCustomer('FastWriter');
        $this->actingAs($owner);

        for ($i = 0; $i < 20; $i++) {
            $this->postJson("/api/v1/products/{$product->slug}/reviews", [])
                ->assertUnprocessable();
        }

        $this->postJson("/api/v1/products/{$product->slug}/reviews", ['rating' => 5])
            ->assertStatus(429)
            ->assertJsonPath('title', 'Rate limit exceeded');
    }

    private function createVisibleProduct(string $slug): Product
    {
        $product = Product::factory()->create([
            'slug' => $slug,
            'status' => ProductStatus::Active,
        ]);
        $product->categories()->sync([$product->primary_category_id]);
        ProductVariant::factory()->create([
            'product_id' => $product->getKey(),
            'is_default' => true,
            'is_active' => true,
        ]);
        ProductImage::factory()->create([
            'product_id' => $product->getKey(),
            'is_primary' => true,
        ]);

        return $product;
    }

    private function createCustomer(string $name): User
    {
        $user = User::factory()->create(['name' => $name]);
        $role = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $user->roles()->attach($role, ['assigned_at' => now()]);

        return $user;
    }

    private function createAdmin(): User
    {
        $user = User::factory()->create(['name' => 'GlowCare Support']);
        $role = Role::query()->where('code', RoleCode::SuperAdmin->value)->sole();
        $user->roles()->attach($role, ['assigned_at' => now()]);

        return $user;
    }
}

final class CustomerFakeReviewMediaStorage implements ReviewMediaStorage
{
    public function createSignedUpload(ReviewUploadIntent $intent): SignedReviewUpload
    {
        return new SignedReviewUpload(
            uploadUrl: 'https://api.cloudinary.com/v1_1/test/image/upload',
            method: 'POST',
            fields: ['public_id' => $intent->provider_asset_key, 'type' => 'authenticated'],
        );
    }

    public function verifyUploadedAsset(ReviewUploadIntent $intent): VerifiedReviewAsset
    {
        return new VerifiedReviewAsset(
            publicId: $intent->provider_asset_key,
            assetId: (string) Str::uuid(),
            resourceType: $intent->kind === ReviewMediaKind::Video ? 'video' : 'image',
            deliveryType: 'authenticated',
            format: $intent->kind === ReviewMediaKind::Video ? 'mp4' : 'jpg',
            mimeType: $intent->kind === ReviewMediaKind::Video ? 'video/mp4' : 'image/jpeg',
            bytes: 150_000,
            width: 1000,
            height: 1000,
            durationSeconds: $intent->kind === ReviewMediaKind::Video ? 10.0 : null,
        );
    }

    public function signedDeliveryUrl(ReviewMedia $media, int $ttlSeconds): SignedMediaUrl
    {
        $expiresAt = CarbonImmutable::now()->addSeconds($ttlSeconds);

        return new SignedMediaUrl(
            url: "https://api.cloudinary.com/v1_1/test/{$media->resource_type}/download?public_id={$media->storage_path}&expires_at={$expiresAt->getTimestamp()}",
            expiresAt: $expiresAt,
        );
    }

    public function delete(string $publicId, string $resourceType, string $deliveryType): void {}
}
