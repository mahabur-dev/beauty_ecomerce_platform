<?php

namespace Tests\Feature\Review;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Contracts\ReviewMediaStorage;
use App\Domain\Review\Data\SignedMediaUrl;
use App\Domain\Review\Data\SignedReviewUpload;
use App\Domain\Review\Data\VerifiedReviewAsset;
use App\Domain\Review\Enums\ReviewStatus;
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Domain\Vendor\Models\Vendor;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class AdminReviewModerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);
        $this->app->instance(ReviewMediaStorage::class, new AdminFakeReviewMediaStorage);
    }

    public function test_admin_can_filter_search_moderate_reply_and_inspect_audit_timeline(): void
    {
        $vendor = Vendor::factory()->create();
        $superAdmin = $this->authenticateAdmin(RoleCode::SuperAdmin);
        $customer = $this->createCustomer('Nusrat', 'nusrat@example.com');
        $product = Product::factory()->create([
            'vendor_id' => $vendor->getKey(),
            'name' => 'Rosewater Mist',
            'slug' => 'rosewater-mist',
            'status' => ProductStatus::Active,
        ]);

        $review = ProductReview::factory()->create([
            'product_id' => $product->getKey(),
            'user_id' => $customer->getKey(),
            'vendor_id' => $vendor->getKey(),
            'rating' => 5,
            'title' => 'Refreshing spray',
            'body' => 'Keeps skin calm throughout humid days.',
            'status' => ReviewStatus::Pending,
            'submitted_at' => now()->subDay(),
        ]);
        ReviewMedia::factory()->for($review, 'review')->create();

        // Filter, search, and verify bounded queries.
        DB::flushQueryLog();
        DB::enableQueryLog();
        $list = $this->getJson('/api/v1/admin/reviews?search=Rosewater&status=pending&rating=5&with_media=true');
        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $list->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $review->getKey())
            ->assertJsonPath('data.0.author.email', 'nusrat@example.com')
            ->assertJsonPath('data.0.media.0.kind', 'image');
        self::assertLessThanOrEqual(12, $queryCount, 'Admin review table queries must remain bounded.');

        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $this->getJson("/api/v1/admin/reviews?product_id={$product->getKey()}&date_from={$yesterday}&date_to={$today}&trash=without")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/admin/reviews?trash=only')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Moderation reason is required.
        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/moderate", [
            'status' => 'approved',
        ])->assertUnprocessable()->assertJsonValidationErrors(['reason']);

        // Approve review.
        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/moderate", [
            'status' => 'approved',
            'reason' => 'Verified authentic product feedback and clean media.',
            'lock_version' => 1,
        ])->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.lock_version', 2);

        // Same-status moderation returns 409, and stale lock_version returns 409.
        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/moderate", [
            'status' => 'approved',
            'reason' => 'Duplicate approve.',
            'lock_version' => 2,
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Invalid status transition');

        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/moderate", [
            'status' => 'hidden',
            'reason' => 'Stale version attempt.',
            'lock_version' => 1,
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Version conflict');

        // Official reply create, duplicate conflict, edit, delete, and recreate after soft-delete.
        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/reply", [
            'body' => 'Thank you for choosing GlowCare!',
        ])->assertCreated()
            ->assertJsonPath('data.body', 'Thank you for choosing GlowCare!');

        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/reply", [
            'body' => 'Duplicate reply',
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Reply already exists');

        $this->patchJson("/api/v1/admin/reviews/{$review->getKey()}/reply", [
            'body' => 'Thank you for choosing GlowCare! We appreciate your review.',
        ])->assertOk()
            ->assertJsonPath('data.body', 'Thank you for choosing GlowCare! We appreciate your review.');

        $this->deleteJson("/api/v1/admin/reviews/{$review->getKey()}/reply")
            ->assertNoContent();

        $this->putJson("/api/v1/admin/reviews/{$review->getKey()}/reply", [
            'body' => 'Restored official reply body.',
        ])->assertOk()
            ->assertJsonPath('data.body', 'Restored official reply body.');

        // Hide review and verify audit timeline contains full moderation and reply history.
        $this->postJson("/api/v1/admin/reviews/{$review->getKey()}/moderate", [
            'status' => 'hidden',
            'reason' => 'Temporarily hidden during batch inspection.',
            'lock_version' => 2,
        ])->assertOk()
            ->assertJsonPath('data.status', 'hidden')
            ->assertJsonPath('data.published_at', null);

        $detail = $this->getJson("/api/v1/admin/reviews/{$review->getKey()}");
        $detail->assertOk()
            ->assertJsonPath('data.moderator.id', $superAdmin->getKey())
            ->assertJsonPath('data.reply.body', 'Restored official reply body.');

        /** @var list<string> $actions */
        $actions = collect($detail->json('data.audit_logs'))->pluck('action')->all();
        self::assertContains('review.approved', $actions);
        self::assertContains('review.reply_created', $actions);
        self::assertContains('review.reply_updated', $actions);
        self::assertContains('review.reply_deleted', $actions);
        self::assertContains('review.hidden', $actions);
    }

    public function test_catalog_manager_is_isolated_to_assigned_vendor_and_customer_cannot_access_admin_reviews(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $customer = $this->createCustomer('Customer', 'customer@example.com');

        $productA = Product::factory()->create(['vendor_id' => $vendorA->getKey()]);
        $productB = Product::factory()->create(['vendor_id' => $vendorB->getKey()]);

        $reviewA = ProductReview::factory()->create([
            'product_id' => $productA->getKey(),
            'user_id' => $customer->getKey(),
            'vendor_id' => $vendorA->getKey(),
        ]);
        $reviewB = ProductReview::factory()->create([
            'product_id' => $productB->getKey(),
            'user_id' => $customer->getKey(),
            'vendor_id' => $vendorB->getKey(),
        ]);

        $this->actingAs($customer)
            ->getJson('/api/v1/admin/reviews')
            ->assertForbidden();

        $this->authenticateAdmin(RoleCode::CatalogManager, $vendorA);

        $this->getJson('/api/v1/admin/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reviewA->getKey());

        $this->getJson("/api/v1/admin/reviews/{$reviewA->getKey()}")->assertOk();
        $this->getJson("/api/v1/admin/reviews/{$reviewB->getKey()}")->assertForbidden();

        $this->postJson("/api/v1/admin/reviews/{$reviewB->getKey()}/moderate", [
            'status' => 'rejected',
            'reason' => 'Cross-vendor moderation attempt',
        ])->assertForbidden();

        $this->putJson("/api/v1/admin/reviews/{$reviewB->getKey()}/reply", [
            'body' => 'Cross-vendor reply attempt',
        ])->assertForbidden();
    }

    private function createCustomer(string $name, string $email): User
    {
        $user = User::factory()->create(['name' => $name, 'email' => $email]);
        $role = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $user->roles()->attach($role, ['assigned_at' => now()]);

        return $user;
    }

    private function authenticateAdmin(RoleCode $roleCode, ?Vendor $vendor = null): User
    {
        $user = User::factory()->create(['vendor_id' => $vendor?->getKey()]);
        $customerRole = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $adminRole = Role::query()->where('code', $roleCode->value)->sole();
        $user->roles()->attach([
            $customerRole->getKey() => ['assigned_at' => now()],
            $adminRole->getKey() => ['assigned_at' => now()],
        ]);
        $this->actingAs($user)->withSession([
            (string) config('identity.mfa_verified_session_key') => now()->timestamp,
        ]);

        return $user;
    }
}

final class AdminFakeReviewMediaStorage implements ReviewMediaStorage
{
    public function createSignedUpload(ReviewUploadIntent $intent): SignedReviewUpload
    {
        return new SignedReviewUpload('https://api.cloudinary.com/v1_1/test/image/upload', 'POST', []);
    }

    public function verifyUploadedAsset(ReviewUploadIntent $intent): VerifiedReviewAsset
    {
        return new VerifiedReviewAsset(
            publicId: $intent->provider_asset_key,
            assetId: (string) Str::uuid(),
            resourceType: 'image',
            deliveryType: 'authenticated',
            format: 'jpg',
            mimeType: 'image/jpeg',
            bytes: 100_000,
            width: 800,
            height: 800,
            durationSeconds: null,
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

    public function delete(string $publicId, string $resourceType, string $deliveryType): void {}
}
