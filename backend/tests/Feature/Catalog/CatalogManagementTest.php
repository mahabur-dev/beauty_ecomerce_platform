<?php

namespace Tests\Feature\Catalog;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Media\Data\UploadedAsset;
use App\Domain\Shared\Enums\RecordStatus;
use App\Jobs\DeleteMediaAsset;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

final class CatalogManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);
        $this->withHeader('Origin', 'http://localhost:3001');
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_authorized_admin_can_manage_separate_root_and_subcategory_apis(): void
    {
        $this->authenticateAdministrator(RoleCode::CatalogManager);

        $rootResponse = $this->postJson('/api/v1/admin/categories', [
            'name' => 'Hair Care',
            'description' => 'Root category',
            'sort_order' => 10,
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'hair-care')
            ->assertJsonPath('data.parent_id', null);
        $rootId = (int) $rootResponse->json('data.id');

        $childResponse = $this->postJson('/api/v1/admin/subcategories', [
            'category_id' => $rootId,
            'name' => 'Shampoo',
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'shampoo')
            ->assertJsonPath('data.parent_id', $rootId);
        $childId = (int) $childResponse->json('data.id');

        $this->patchJson("/api/v1/admin/subcategories/{$childId}", [
            'name' => 'Professional Shampoo',
            'sort_order' => 5,
        ])->assertOk()
            ->assertJsonPath('data.slug', 'professional-shampoo')
            ->assertJsonPath('data.sort_order', 5);

        $this->getJson('/api/v1/admin/categories?search=Hair&per_page=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.children_count', 1);
        $this->getJson("/api/v1/admin/subcategories?category_id={$rootId}")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertDatabaseHas('audit_logs', ['action' => 'catalog.category_created']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'catalog.subcategory_updated']);
        $this->postJson("/api/v1/admin/categories/{$rootId}/restore")
            ->assertConflict()
            ->assertJsonPath('title', 'Category is already active');
    }

    public function test_two_level_hierarchy_and_active_root_are_enforced(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        $root = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->getKey()]);

        $this->postJson('/api/v1/admin/subcategories', [
            'category_id' => $child->getKey(),
            'name' => 'Forbidden third level',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('category_id');

        $root->forceFill(['status' => 'inactive'])->save();
        $this->postJson('/api/v1/admin/subcategories', [
            'category_id' => $root->getKey(),
            'name' => 'Inactive parent child',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('category_id');

        $this->getJson("/api/v1/admin/categories/{$child->getKey()}")
            ->assertNotFound()
            ->assertJsonPath('title', 'Category not found');
    }

    public function test_category_soft_delete_restore_order_and_reserved_slug_are_enforced(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        $root = Category::factory()->create(['name' => 'Makeup', 'slug' => 'makeup']);
        $child = Category::factory()->create([
            'parent_id' => $root->getKey(),
            'name' => 'Lips',
            'slug' => 'lips',
        ]);

        $this->deleteJson("/api/v1/admin/categories/{$root->getKey()}")
            ->assertConflict()
            ->assertJsonPath('title', 'Category is in use');

        $this->deleteJson("/api/v1/admin/subcategories/{$child->getKey()}")->assertNoContent();
        $this->deleteJson("/api/v1/admin/categories/{$root->getKey()}")->assertNoContent();
        $this->assertSoftDeleted('categories', ['id' => $root->getKey()]);
        $this->assertSoftDeleted('categories', ['id' => $child->getKey()]);

        $this->postJson("/api/v1/admin/subcategories/{$child->getKey()}/restore")
            ->assertUnprocessable();
        $this->postJson("/api/v1/admin/categories/{$root->getKey()}/restore")
            ->assertOk();
        $this->postJson("/api/v1/admin/subcategories/{$child->getKey()}/restore")
            ->assertOk();

        $this->deleteJson("/api/v1/admin/subcategories/{$child->getKey()}")->assertNoContent();
        $this->postJson('/api/v1/admin/subcategories', [
            'category_id' => $root->getKey(),
            'name' => 'New Lips',
            'slug' => 'lips',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('slug');
    }

    public function test_product_links_block_subcategory_and_brand_deletion(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        $root = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->getKey()]);
        $brand = Brand::factory()->create();
        Product::factory()->create([
            'primary_category_id' => $child->getKey(),
            'brand_id' => $brand->getKey(),
        ]);

        $this->deleteJson("/api/v1/admin/subcategories/{$child->getKey()}")
            ->assertConflict()
            ->assertJsonPath('title', 'Category is in use');
        $this->deleteJson("/api/v1/admin/brands/{$brand->getKey()}")
            ->assertConflict()
            ->assertJsonPath('title', 'Brand is in use');
    }

    public function test_catalog_manager_cannot_manage_global_brands(): void
    {
        $this->authenticateAdministrator(RoleCode::CatalogManager);
        $this->getJson('/api/v1/admin/brands')->assertOk();
        $this->postJson('/api/v1/admin/brands', ['name' => 'Denied Brand'])->assertForbidden();
    }

    public function test_super_admin_can_manage_global_brands(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        $created = $this->postJson('/api/v1/admin/brands', ['name' => 'Global Beauty'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'global-beauty');
        $brandId = (int) $created->json('data.id');

        $this->patchJson("/api/v1/admin/brands/{$brandId}", ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('data.status', 'inactive');
        $this->deleteJson("/api/v1/admin/brands/{$brandId}")->assertNoContent();
        $this->getJson('/api/v1/admin/brands?trash=only')
            ->assertOk()
            ->assertJsonPath('data.0.id', $brandId);
        $this->postJson("/api/v1/admin/brands/{$brandId}/restore")->assertOk();
        $this->postJson("/api/v1/admin/brands/{$brandId}/restore")
            ->assertConflict()
            ->assertJsonPath('title', 'Brand is already active');

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'catalog.brand_restored',
            'subject_id' => $brandId,
        ]);
    }

    public function test_catalog_overview_consolidates_summary_and_active_options(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        $root = Category::factory()->create(['status' => RecordStatus::Active]);
        $child = Category::factory()->create([
            'parent_id' => $root->getKey(),
            'status' => RecordStatus::Active,
        ]);
        Category::factory()->create(['status' => RecordStatus::Inactive]);
        $activeBrand = Brand::factory()->create(['status' => RecordStatus::Active]);
        Brand::factory()->create(['status' => RecordStatus::Inactive]);
        Product::factory()->create([
            'primary_category_id' => $child->getKey(),
            'brand_id' => $activeBrand->getKey(),
            'status' => ProductStatus::Draft,
        ]);

        $this->getJson('/api/v1/admin/catalog/summary')
            ->assertOk()
            ->assertJsonPath('data.products.total', 1)
            ->assertJsonPath('data.products.draft', 1)
            ->assertJsonPath('data.categories.total', 2)
            ->assertJsonPath('data.categories.active', 1)
            ->assertJsonPath('data.categories.inactive', 1)
            ->assertJsonPath('data.subcategories.total', 1);

        $this->getJson('/api/v1/admin/catalog/options')
            ->assertOk()
            ->assertJsonCount(1, 'data.categories')
            ->assertJsonCount(1, 'data.subcategories')
            ->assertJsonCount(1, 'data.brands')
            ->assertJsonPath('data.categories.0.id', $root->getKey())
            ->assertJsonPath('data.brands.0.id', $activeBrand->getKey());
    }

    public function test_catalog_reads_and_writes_use_independent_rate_limit_buckets(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        config()->set('catalog.rate_limits.write_per_minute', 2);

        $this->postJson('/api/v1/admin/categories', [])->assertUnprocessable();
        $this->postJson('/api/v1/admin/categories', [])->assertUnprocessable();
        $limited = $this->postJson('/api/v1/admin/categories', [])
            ->assertTooManyRequests()
            ->assertJsonPath('title', 'Rate limit exceeded');

        self::assertGreaterThan(0, (int) $limited->headers->get('Retry-After'));
        self::assertGreaterThan(0, (int) $limited->json('retry_after'));

        $this->getJson('/api/v1/admin/categories')->assertOk();
    }

    public function test_category_and_subcategory_support_single_cloudinary_image_upload_replace_and_delete(): void
    {
        Queue::fake();
        $fakeMedia = new CategoryTestMediaStorage;
        $this->app->instance(MediaStorage::class, $fakeMedia);
        $this->authenticateAdministrator(RoleCode::CatalogManager);

        $rootResponse = $this->post('/api/v1/admin/categories', [
            'name' => 'Serums & Essences',
            'description' => 'Concentrated facial treatments',
            'image' => UploadedFile::fake()->image('serums.webp', 640, 640),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'serums-essences')
            ->assertJsonPath('data.image.format', 'jpg')
            ->assertJsonPath('data.image.width', 640);

        $rootId = (int) $rootResponse->json('data.id');
        $firstUrl = (string) $rootResponse->json('data.image.url');
        self::assertStringContainsString('/categories/'.$rootId.'/', (string) $fakeMedia->uploaded[0]);
        self::assertStringStartsWith('https://res.cloudinary.com/', $firstUrl);

        $childResponse = $this->post('/api/v1/admin/subcategories', [
            'category_id' => $rootId,
            'name' => 'Vitamin C Serums',
            'image' => UploadedFile::fake()->image('vitc.png', 512, 512),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.parent_id', $rootId)
            ->assertJsonPath('data.image.width', 512);
        $childId = (int) $childResponse->json('data.id');

        // Public endpoints expose safe image metadata and omit internal storage paths.
        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonPath('data.0.image.url', $firstUrl)
            ->assertJsonPath('data.0.subcategories.0.image.width', 512)
            ->assertJsonMissingPath('data.0.image_storage_path')
            ->assertJsonMissingPath('data.0.image_asset_id');

        // Replacing root category image stores new Cloudinary asset and queues old asset deletion.
        $replaceResponse = $this->post("/api/v1/admin/categories/{$rootId}/image", [
            'image' => UploadedFile::fake()->image('serums-v2.jpg', 900, 900),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.image.width', 900);

        $replacedUrl = (string) $replaceResponse->json('data.image.url');
        self::assertNotSame($firstUrl, $replacedUrl);
        Queue::assertPushed(DeleteMediaAsset::class, 1);

        // Removing image via DELETE endpoint clears columns and dispatches Cloudinary deletion.
        $this->deleteJson("/api/v1/admin/categories/{$rootId}/image")
            ->assertOk()
            ->assertJsonPath('data.image', null);
        Queue::assertPushed(DeleteMediaAsset::class, 2);

        // Removing subcategory image via PATCH remove_image=true works cleanly.
        $this->patchJson("/api/v1/admin/subcategories/{$childId}", [
            'remove_image' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.image', null);
        Queue::assertPushed(DeleteMediaAsset::class, 3);

        // Non-image files are rejected cleanly.
        $this->post("/api/v1/admin/categories/{$rootId}/image", [
            'image' => UploadedFile::fake()->create('script.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    private function authenticateAdministrator(RoleCode $roleCode): User
    {
        $user = User::factory()->create();
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

final class CategoryTestMediaStorage implements MediaStorage
{
    /** @var list<string> */
    public array $uploaded = [];

    /** @var list<string> */
    public array $deleted = [];

    public function uploadImage(UploadedFile $file, string $folder): UploadedAsset
    {
        $id = (string) Str::uuid();
        $publicId = trim($folder, '/').'/'.$id;
        $this->uploaded[] = $publicId;
        [$width, $height] = @getimagesize((string) $file->getRealPath()) ?: [800, 800];

        return new UploadedAsset(
            publicId: $publicId,
            assetId: $id,
            resourceType: 'image',
            deliveryType: 'upload',
            secureUrl: 'https://res.cloudinary.com/test/image/upload/'.$id.'.jpg',
            format: 'jpg',
            bytes: (int) $file->getSize(),
            width: $width,
            height: $height,
        );
    }

    public function delete(string $publicId, string $resourceType, string $deliveryType): void
    {
        $this->deleted[] = $publicId;
    }
}
