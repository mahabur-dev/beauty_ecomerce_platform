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
use App\Domain\Review\Models\ProductReview;
use App\Domain\Review\Models\ReviewMedia;
use App\Domain\Review\Models\ReviewUploadIntent;
use App\Domain\Vendor\Models\Vendor;
use App\Jobs\DeleteMediaAsset;
use Carbon\CarbonImmutable;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ReviewLifecycleAndSecurityTest extends TestCase
{
    use RefreshDatabase;

    private E2EReviewMediaStorage $mediaStorage;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);
        $this->mediaStorage = new E2EReviewMediaStorage;
        $this->app->instance(ReviewMediaStorage::class, $this->mediaStorage);
    }

    public function test_complete_customer_to_admin_to_public_lifecycle_including_edit_and_media_resets(): void
    {
        Bus::fake();

        $vendor = Vendor::factory()->create();
        $product = $this->createVisibleProduct('glow-elixir', $vendor);
        $customer = $this->createCustomer('Amina Rahman', 'amina@example.com');
        $otherCustomer = $this->createCustomer('Farah Khan', 'farah@example.com');
        $admin = $this->createAdmin(RoleCode::CatalogManager, $vendor);

        // 1. Customer submits review and uploads signed private media.
        $this->actingAs($customer);
        $created = $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
            'title' => 'Radiant overnight results',
            'body' => 'Leaves my dry skin soft by morning.',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.lock_version', 1);

        $reviewId = (int) $created->json('data.id');

        $intent = $this->postJson("/api/v1/reviews/{$reviewId}/media/intents", [
            'kind' => 'image',
            'format' => 'webp',
            'mime_type' => 'image/webp',
            'bytes' => 240_000,
        ])->assertCreated();

        $media = $this->postJson("/api/v1/reviews/{$reviewId}/media/finalize", [
            'token' => (string) $intent->json('data.intent_token'),
            'sort_order' => 0,
        ])->assertCreated();
        $mediaId = (int) $media->json('data.id');

        // 2. Public storefront excludes pending reviews & pending media; owner accesses private media, other is forbidden.
        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('summary.total_reviews', 0);

        $this->getJson("/api/v1/reviews/{$reviewId}/media/{$mediaId}/url")
            ->assertOk()
            ->assertJsonPath('data.id', $mediaId);

        $this->actingAs($otherCustomer)
            ->getJson("/api/v1/reviews/{$reviewId}/media/{$mediaId}/url")
            ->assertForbidden();

        // 3. Admin inspects pending review + private media, approves it, and posts official reply.
        $this->authenticateAdmin($admin);

        $this->getJson("/api/v1/admin/reviews/{$reviewId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonCount(1, 'data.media')
            ->assertJsonPath('data.media.0.id', $mediaId);

        $this->postJson("/api/v1/admin/reviews/{$reviewId}/moderate", [
            'status' => 'approved',
            'reason' => 'Verified constructive review and appropriate imagery.',
            'lock_version' => 1,
        ])->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.lock_version', 2);

        $this->postJson("/api/v1/admin/reviews/{$reviewId}/reply", [
            'body' => 'Thank you for trusting GlowCare with your evening routine!',
        ])->assertCreated();

        // 4. Approved review, media, official reply & summary are now live publicly.
        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reviewId)
            ->assertJsonPath('data.0.media.0.id', $mediaId)
            ->assertJsonPath('data.0.reply.body', 'Thank you for trusting GlowCare with your evening routine!')
            ->assertJsonPath('summary.average_rating', 5)
            ->assertJsonPath('summary.total_reviews', 1)
            ->assertJsonPath('summary.distribution.5', 1);

        // 5. Customer edits approved review -> reverts to pending and disappears publicly until re-approved.
        $this->actingAs($customer)
            ->patchJson("/api/v1/reviews/{$reviewId}", [
                'rating' => 4,
                'title' => 'Updated: still gentle after a month',
                'lock_version' => 2,
            ])->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.published_at', null)
            ->assertJsonPath('data.moderation_reason', null)
            ->assertJsonPath('data.lock_version', 3);

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('summary.total_reviews', 0);

        // 6. Admin updates official reply and re-approves -> public rating & listing update immediately.
        $this->authenticateAdmin($admin);
        $this->patchJson("/api/v1/admin/reviews/{$reviewId}/reply", [
            'body' => 'Thanks for updating your one-month experience!',
        ])->assertOk();

        $this->postJson("/api/v1/admin/reviews/{$reviewId}/moderate", [
            'status' => 'approved',
            'reason' => 'Re-approved after customer one-month update.',
            'lock_version' => 3,
        ])->assertOk()
            ->assertJsonPath('data.lock_version', 4);

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rating', 4)
            ->assertJsonPath('data.0.reply.body', 'Thanks for updating your one-month experience!')
            ->assertJsonPath('summary.average_rating', 4)
            ->assertJsonPath('summary.total_reviews', 1);

        // 7. Customer removes media from approved review -> also resets approval to pending & dispatches cleanup job.
        $this->actingAs($customer)
            ->deleteJson("/api/v1/reviews/{$reviewId}/media/{$mediaId}")
            ->assertNoContent();
        Bus::assertDispatched(DeleteMediaAsset::class);

        $this->getJson("/api/v1/reviews/{$reviewId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.lock_version', 5)
            ->assertJsonCount(0, 'data.media');

        $this->getJson("/api/v1/products/{$product->slug}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // 8. Customer deletes review -> admin retains audit history under trash=with; customer may resubmit.
        $this->deleteJson("/api/v1/reviews/{$reviewId}")->assertNoContent();

        $this->authenticateAdmin($admin);
        $detail = $this->getJson("/api/v1/admin/reviews/{$reviewId}")->assertOk();
        /** @var list<string> $actions */
        $actions = collect($detail->json('data.audit_logs'))->pluck('action')->all();
        self::assertContains('review.submitted', $actions);
        self::assertContains('review.approved', $actions);
        self::assertContains('review.updated', $actions);
        self::assertContains('review.media_removed', $actions);
        self::assertContains('review.deleted', $actions);

        $this->getJson('/api/v1/admin/reviews?trash=only')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reviewId);

        $this->actingAs($customer)
            ->postJson("/api/v1/products/{$product->slug}/reviews", [
                'rating' => 5,
                'title' => 'Fresh review after removal',
            ])->assertCreated();
    }

    public function test_security_idor_xss_payload_integrity_mass_assignment_and_mfa_guards(): void
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $productA = $this->createVisibleProduct('serum-a', $vendorA);
        $productB = $this->createVisibleProduct('serum-b', $vendorB);

        $customerA = $this->createCustomer('Customer A', 'a@example.com');
        $customerB = $this->createCustomer('Customer B', 'b@example.com');
        $unassignedManager = $this->createAdmin(RoleCode::CatalogManager, null);
        $mfaPendingAdmin = $this->createAdmin(RoleCode::SuperAdmin, null);

        $xssTitle = '<script>alert("title-xss")</script>';
        $xssBody = '<img src=x onerror="alert(1)">Great serum';
        $xssReason = '<b>Moderated</b> cleanly';
        $xssReply = '<script>fetch("/steal")</script>Thanks!';

        // Customer A creates review with XSS payloads + unauthorized mass-assignment fields.
        $this->actingAs($customerA);
        $createA = $this->postJson("/api/v1/products/{$productA->slug}/reviews", [
            'rating' => 5,
            'title' => $xssTitle,
            'body' => $xssBody,
            'status' => 'approved',
            'verified_purchase' => true,
            'user_id' => $customerB->getKey(),
            'vendor_id' => $vendorB->getKey(),
            'published_at' => now()->toISOString(),
            'active_slot' => null,
            'moderation_reason' => 'Bypassed',
        ])->assertCreated();

        $reviewAId = (int) $createA->json('data.id');
        $this->assertDatabaseHas('product_reviews', [
            'id' => $reviewAId,
            'user_id' => $customerA->getKey(),
            'vendor_id' => $vendorA->getKey(),
            'status' => 'pending',
            'verified_purchase' => false,
            'moderation_reason' => null,
        ]);

        // Cross-review media/intent IDOR checks.
        $intentA = $this->postJson("/api/v1/reviews/{$reviewAId}/media/intents", [
            'kind' => 'image',
            'format' => 'jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 100_000,
        ])->assertCreated();
        $tokenA = (string) $intentA->json('data.intent_token');

        $reviewB = ProductReview::factory()->create([
            'product_id' => $productB->getKey(),
            'user_id' => $customerA->getKey(),
            'vendor_id' => $vendorB->getKey(),
        ]);
        $mediaB = ReviewMedia::factory()->for($reviewB, 'review')->create();

        // Same owner cannot attach Review A's intent to Review B, or view/delete Review B's media through Review A.
        $this->postJson("/api/v1/reviews/{$reviewB->getKey()}/media/finalize", [
            'token' => $tokenA,
        ])->assertNotFound();
        $this->getJson("/api/v1/reviews/{$reviewAId}/media/{$mediaB->getKey()}/url")->assertNotFound();
        $this->deleteJson("/api/v1/reviews/{$reviewAId}/media/{$mediaB->getKey()}")->assertNotFound();

        // Customer B cannot read, mutate, upload media, or cancel intent on Customer A's review.
        $this->actingAs($customerB);
        $this->getJson("/api/v1/reviews/{$reviewAId}")->assertForbidden();
        $this->patchJson("/api/v1/reviews/{$reviewAId}", ['rating' => 1])->assertForbidden();
        $this->deleteJson("/api/v1/reviews/{$reviewAId}")->assertForbidden();
        $this->deleteJson("/api/v1/reviews/{$reviewAId}/media/intents/{$tokenA}")->assertForbidden();

        // Unauthenticated and non-admin callers cannot access admin review moderation routes.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/admin/reviews')->assertUnauthorized();

        $this->actingAs($customerB)
            ->getJson('/api/v1/admin/reviews')
            ->assertForbidden();

        // When MFA enforcement is active, stateless or unverified admin requests are blocked (403, never 500).
        config(['identity.mfa_enabled' => true]);
        $this->actingAs($mfaPendingAdmin)
            ->getJson('/api/v1/admin/reviews')
            ->assertForbidden()
            ->assertJsonPath('title', 'MFA required');

        $this->actingAs($mfaPendingAdmin)
            ->withSession([])
            ->getJson('/api/v1/admin/reviews')
            ->assertForbidden()
            ->assertJsonPath('title', 'MFA required');

        // Restore configured app setting before continuing non-MFA actingAs security assertions.
        config(['identity.mfa_enabled' => false]);

        $this->authenticateAdmin($unassignedManager)
            ->getJson('/api/v1/admin/reviews')
            ->assertForbidden();

        // SuperAdmin moderates and replies with XSS-like text safely JSON-encoded.
        $this->authenticateAdmin($mfaPendingAdmin);
        $this->postJson("/api/v1/admin/reviews/{$reviewAId}/moderate", [
            'status' => 'approved',
            'reason' => $xssReason,
            'lock_version' => 1,
            'user_id' => $customerB->getKey(),
        ])->assertOk()
            ->assertHeader('content-type', 'application/json')
            ->assertJsonPath('data.title', $xssTitle)
            ->assertJsonPath('data.moderation_reason', $xssReason);

        $this->postJson("/api/v1/admin/reviews/{$reviewAId}/reply", [
            'body' => $xssReply,
        ])->assertCreated()
            ->assertJsonPath('data.body', $xssReply);

        $publicRes = $this->getJson("/api/v1/products/{$productA->slug}/reviews")
            ->assertOk()
            ->assertHeader('content-type', 'application/json')
            ->assertJsonPath('data.0.title', $xssTitle)
            ->assertJsonPath('data.0.body', $xssBody)
            ->assertJsonPath('data.0.reply.body', $xssReply);
        self::assertSame($xssTitle, $publicRes->json('data.0.title'));
        self::assertSame($xssBody, $publicRes->json('data.0.body'));
    }

    public function test_concurrent_lock_version_conflicts_and_tampered_cloudinary_asset_cleanup(): void
    {
        $vendor = Vendor::factory()->create();
        $product = $this->createVisibleProduct('barrier-balm', $vendor);
        $customer = $this->createCustomer('Nadia', 'nadia@example.com');
        $admin = $this->createAdmin(RoleCode::SuperAdmin, null);

        $this->actingAs($customer);
        $review = $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 4,
            'title' => 'Initial draft review',
        ])->assertCreated();
        $reviewId = (int) $review->json('data.id');

        // Race 1: Admin approves (lock_version 1 -> 2), then customer submits edit with stale lock_version=1 -> 409.
        $this->authenticateAdmin($admin);
        $this->postJson("/api/v1/admin/reviews/{$reviewId}/moderate", [
            'status' => 'approved',
            'reason' => 'Approved clean review.',
            'lock_version' => 1,
        ])->assertOk()
            ->assertJsonPath('data.lock_version', 2);

        $this->actingAs($customer);
        $this->patchJson("/api/v1/reviews/{$reviewId}", [
            'title' => 'Customer stale edit',
            'lock_version' => 1,
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Version conflict');

        // Customer reloads lock_version=2 and edits -> bumps lock_version to 3 and resets to pending.
        $this->patchJson("/api/v1/reviews/{$reviewId}", [
            'title' => 'Customer synced edit',
            'lock_version' => 2,
        ])->assertOk()
            ->assertJsonPath('data.lock_version', 3);

        // Race 2: Admin submits moderation with stale lock_version=2 -> 409.
        $this->authenticateAdmin($admin);
        $this->postJson("/api/v1/admin/reviews/{$reviewId}/moderate", [
            'status' => 'rejected',
            'reason' => 'Stale moderator attempt.',
            'lock_version' => 2,
        ])->assertStatus(409)
            ->assertJsonPath('title', 'Version conflict');

        // Cloudinary server-side verification rejects non-authenticated delivery_type and calls cleanup delete().
        $this->actingAs($customer);
        $intent = $this->postJson("/api/v1/reviews/{$reviewId}/media/intents", [
            'kind' => 'image',
            'format' => 'jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 50_000,
        ])->assertCreated();
        $token = (string) $intent->json('data.intent_token');

        $this->mediaStorage->nextVerifiedDeliveryType = 'upload';
        $this->postJson("/api/v1/reviews/{$reviewId}/media/finalize", [
            'token' => $token,
        ])->assertUnprocessable()
            ->assertJsonPath('title', 'Media verification failed');

        self::assertCount(1, $this->mediaStorage->deletedPublicIds);
        $this->assertDatabaseHas('review_upload_intents', [
            'token' => $token,
            'status' => 'cancelled',
        ]);
    }

    private function createVisibleProduct(string $slug, Vendor $vendor): Product
    {
        $product = Product::factory()->create([
            'vendor_id' => $vendor->getKey(),
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

    private function createCustomer(string $name, string $email): User
    {
        $user = User::factory()->create(['name' => $name, 'email' => $email]);
        $role = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $user->roles()->attach($role, ['assigned_at' => now()]);

        return $user;
    }

    private function createAdmin(RoleCode $roleCode, ?Vendor $vendor): User
    {
        $user = User::factory()->create(['vendor_id' => $vendor?->getKey()]);
        $customerRole = Role::query()->where('code', RoleCode::Customer->value)->sole();
        $adminRole = Role::query()->where('code', $roleCode->value)->sole();
        $user->roles()->attach([
            $customerRole->getKey() => ['assigned_at' => now()],
            $adminRole->getKey() => ['assigned_at' => now()],
        ]);

        return $user;
    }

    private function authenticateAdmin(User $admin): self
    {
        $this->actingAs($admin)->withSession([
            (string) config('identity.mfa_verified_session_key') => now()->timestamp,
        ]);

        return $this;
    }
}

final class E2EReviewMediaStorage implements ReviewMediaStorage
{
    public string $nextVerifiedDeliveryType = 'authenticated';

    /** @var list<string> */
    public array $deletedPublicIds = [];

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
            deliveryType: $this->nextVerifiedDeliveryType,
            format: $intent->kind === ReviewMediaKind::Video ? 'mp4' : 'webp',
            mimeType: $intent->kind === ReviewMediaKind::Video ? 'video/mp4' : 'image/webp',
            bytes: 180_000,
            width: 1000,
            height: 1000,
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

    public function delete(string $publicId, string $resourceType, string $deliveryType): void
    {
        $this->deletedPublicIds[] = $publicId;
    }
}
