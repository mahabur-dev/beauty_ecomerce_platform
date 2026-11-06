<?php

namespace Tests\Feature\Catalog;

use App\Domain\Catalog\Models\Attribute as CatalogAttribute;
use App\Domain\Catalog\Models\AttributeValue;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Catalog\Models\ProductImage;
use App\Domain\Catalog\Models\ProductVariant;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use App\Domain\Media\Contracts\MediaStorage;
use App\Domain\Media\Data\UploadedAsset;
use App\Domain\Vendor\Models\Vendor;
use App\Jobs\DeleteMediaAsset;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

final class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private FakeMediaStorage $media;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::clear();
        $this->seed(RoleSeeder::class);
        $this->withHeader('Origin', 'http://localhost:3001');
        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->media = new FakeMediaStorage;
        $this->app->instance(MediaStorage::class, $this->media);
        Vendor::factory()->create(['slug' => 'platform-vendor']);
    }

    public function test_product_creation_persists_category_pair_multiple_variants_and_prices(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        [$root, $child, $brand] = $this->catalogFixture();
        [$red, $blue] = $this->colorValues();

        $response = $this->postJson('/api/v1/admin/products', $this->productPayload(
            $root,
            $child,
            $brand,
            [
                $this->variant('Red', 'RED-001', true, [$red->getKey()], 1200, 1500),
                $this->variant('Blue', 'BLUE-001', false, [$blue->getKey()], 1300, null),
            ],
        ));

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.new_price', '1200.00')
            ->assertJsonPath('data.old_price', '1500.00')
            ->assertJsonCount(2, 'data.variants');
        $productId = (int) $response->json('data.id');

        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'primary_category_id' => $child->getKey(),
            'brand_id' => $brand->getKey(),
        ]);
        $this->assertDatabaseHas('product_categories', [
            'product_id' => $productId,
            'category_id' => $child->getKey(),
        ]);
        self::assertSame(1, ProductVariant::query()->where('product_id', $productId)->where('is_default', true)->count());
    }

    public function test_category_default_and_variant_combination_invariants_are_enforced(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        [$root, $child, $brand] = $this->catalogFixture();
        $otherRoot = Category::factory()->create();
        [$red] = $this->colorValues();

        $payload = $this->productPayload($otherRoot, $child, $brand, [
            $this->variant('Default', 'PAIR-001', true, [], 1000, null),
        ]);
        $this->postJson('/api/v1/admin/products', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('detail', 'Category and subcategory must be an active parent-child pair.');

        $payload = $this->productPayload($root, $child, $brand, [
            $this->variant('One', 'DEF-001', false, [], 1000, null),
            $this->variant('Two', 'DEF-002', false, [$red->getKey()], 1100, null),
        ]);
        $this->postJson('/api/v1/admin/products', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('detail', 'Exactly one variant must be marked as default.');

        $payload = $this->productPayload($root, $child, $brand, [
            $this->variant('One', 'COMBO-001', true, [$red->getKey()], 1000, null),
            $this->variant('Two', 'COMBO-002', false, [$red->getKey()], 1100, null),
        ]);
        $this->postJson('/api/v1/admin/products', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('detail', 'Variant attribute combinations must be unique.');
    }

    public function test_default_variant_switch_is_atomic_and_default_cannot_be_deleted(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        [$root, $child, $brand] = $this->catalogFixture();
        [$red, $blue] = $this->colorValues();
        $productId = (int) $this->postJson('/api/v1/admin/products', $this->productPayload(
            $root,
            $child,
            $brand,
            [$this->variant('Red', 'SWITCH-RED', true, [$red->getKey()], 1000, null)],
        ))->json('data.id');

        $second = $this->postJson("/api/v1/admin/products/{$productId}/variants", $this->variant(
            'Blue', 'SWITCH-BLUE', true, [$blue->getKey()], 1100, null,
        ))->assertCreated();
        $secondId = (int) $second->json('data.id');

        self::assertSame(1, ProductVariant::query()->where('product_id', $productId)->where('is_default', true)->count());
        $this->deleteJson("/api/v1/admin/products/{$productId}/variants/{$secondId}")
            ->assertConflict()
            ->assertJsonPath('title', 'Variant is required');
        $this->patchJson("/api/v1/admin/products/{$productId}/variants/{$secondId}", ['is_default' => false])
            ->assertUnprocessable();
    }

    public function test_cloudinary_image_flow_enforces_primary_image_and_publishability(): void
    {
        Queue::fake();
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        [$root, $child, $brand] = $this->catalogFixture();
        $productId = (int) $this->postJson('/api/v1/admin/products', $this->productPayload(
            $root,
            $child,
            $brand,
            [$this->variant('Default', 'IMAGE-001', true, [], 1000, null)],
        ))->json('data.id');

        $this->patchJson("/api/v1/admin/products/{$productId}", ['status' => 'active'])
            ->assertUnprocessable()
            ->assertJsonPath('detail', 'A published product requires exactly one primary image.');

        $first = $this->uploadImage($productId, 'front.jpg', false)
            ->assertCreated()
            ->assertJsonPath('data.is_primary', true);
        $firstId = (int) $first->json('data.id');
        $second = $this->uploadImage($productId, 'back.jpg', true)
            ->assertCreated()
            ->assertJsonPath('data.is_primary', true);
        $secondId = (int) $second->json('data.id');
        self::assertSame(1, ProductImage::query()->where('product_id', $productId)->where('is_primary', true)->count());

        $this->patchJson("/api/v1/admin/products/{$productId}", ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
        $this->deleteJson("/api/v1/admin/products/{$productId}/images/{$secondId}")->assertNoContent();
        $this->assertDatabaseHas('product_images', ['id' => $firstId, 'is_primary' => true]);
        Queue::assertPushed(DeleteMediaAsset::class);

        $this->deleteJson("/api/v1/admin/products/{$productId}/images/{$firstId}")
            ->assertConflict()
            ->assertJsonPath('title', 'Primary image required');
    }

    public function test_failed_image_association_compensates_cloud_upload(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        [$root, $child, $brand] = $this->catalogFixture();
        $productId = (int) $this->postJson('/api/v1/admin/products', $this->productPayload(
            $root,
            $child,
            $brand,
            [$this->variant('Default', 'COMP-001', true, [], 1000, null)],
        ))->json('data.id');
        $foreignVariant = ProductVariant::factory()->create();

        $this->post('/api/v1/admin/products/'.$productId.'/images', [
            'image' => UploadedFile::fake()->image('invalid.jpg', 600, 600),
            'product_variant_id' => $foreignVariant->getKey(),
        ], ['Accept' => 'application/json'])->assertUnprocessable();

        self::assertCount(1, $this->media->deleted);
        $this->assertDatabaseCount('product_images', 0);
    }

    public function test_catalog_manager_cannot_access_another_vendor_product(): void
    {
        $foreignVendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $foreignVendor->getKey()]);
        $ownVendor = Vendor::factory()->create();
        $this->authenticateAdministrator(RoleCode::CatalogManager, $ownVendor);

        $this->getJson("/api/v1/admin/products/{$product->getKey()}")
            ->assertForbidden()
            ->assertJsonPath('detail', 'The product is outside your vendor scope.');
    }

    public function test_super_admin_can_manage_global_attributes_and_values_defensively(): void
    {
        $this->authenticateAdministrator(RoleCode::SuperAdmin);
        $attribute = $this->postJson('/api/v1/admin/attributes', [
            'code' => 'skin_type',
            'name' => 'Skin Type',
        ])->assertCreated();
        $attributeId = (int) $attribute->json('data.id');
        $value = $this->postJson("/api/v1/admin/attributes/{$attributeId}/values", [
            'code' => 'dry',
            'value' => 'Dry',
        ])->assertCreated();
        $valueId = (int) $value->json('data.id');

        $this->getJson('/api/v1/admin/attributes')
            ->assertOk()
            ->assertJsonPath('data.0.values.0.code', 'dry');
        $this->deleteJson("/api/v1/admin/attributes/{$attributeId}")
            ->assertConflict()
            ->assertJsonPath('title', 'Attribute is in use');
        $this->patchJson("/api/v1/admin/attributes/{$attributeId}/values/{$valueId}", [
            'value' => 'Very Dry',
        ])->assertOk()->assertJsonPath('data.value', 'Very Dry');
        $this->deleteJson("/api/v1/admin/attributes/{$attributeId}/values/{$valueId}")->assertNoContent();
        $this->deleteJson("/api/v1/admin/attributes/{$attributeId}")->assertNoContent();
    }

    /** @return array{Category, Category, Brand} */
    private function catalogFixture(): array
    {
        $root = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->getKey()]);

        return [$root, $child, Brand::factory()->create()];
    }

    /** @return array{AttributeValue, AttributeValue} */
    private function colorValues(): array
    {
        $attribute = CatalogAttribute::factory()->create(['code' => 'color', 'name' => 'Color']);

        return [
            AttributeValue::factory()->create(['attribute_id' => $attribute->getKey(), 'code' => 'red', 'value' => 'Red']),
            AttributeValue::factory()->create(['attribute_id' => $attribute->getKey(), 'code' => 'blue', 'value' => 'Blue']),
        ];
    }

    /** @param list<array<string, mixed>> $variants @return array<string, mixed> */
    private function productPayload(Category $root, Category $child, Brand $brand, array $variants): array
    {
        return [
            'category_id' => $root->getKey(),
            'subcategory_id' => $child->getKey(),
            'brand_id' => $brand->getKey(),
            'name' => 'Professional Serum '.Str::random(6),
            'description' => 'A detailed product description for assignment coverage.',
            'variants' => $variants,
        ];
    }

    /** @param list<int> $values @return array<string, mixed> */
    private function variant(string $title, string $sku, bool $default, array $values, int $price, ?int $compare): array
    {
        return [
            'title' => $title,
            'sku' => $sku,
            'price' => $price,
            'compare_at_price' => $compare,
            'is_default' => $default,
            'is_active' => true,
            'attribute_value_ids' => $values,
        ];
    }

    private function uploadImage(int $productId, string $name, bool $primary): TestResponse
    {
        return $this->post("/api/v1/admin/products/{$productId}/images", [
            'image' => UploadedFile::fake()->image($name, 800, 800),
            'is_primary' => $primary,
        ], ['Accept' => 'application/json']);
    }

    private function authenticateAdministrator(RoleCode $roleCode, ?Vendor $vendor = null): User
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

final class FakeMediaStorage implements MediaStorage
{
    /** @var list<string> */
    public array $deleted = [];

    public function uploadImage(UploadedFile $file, string $folder): UploadedAsset
    {
        $id = (string) Str::uuid();

        return new UploadedAsset(
            publicId: trim($folder, '/').'/'.$id,
            assetId: $id,
            resourceType: 'image',
            deliveryType: 'upload',
            secureUrl: 'https://res.cloudinary.com/test/image/upload/'.$id.'.jpg',
            format: 'jpg',
            bytes: (int) $file->getSize(),
            width: 800,
            height: 800,
        );
    }

    public function delete(string $publicId, string $resourceType, string $deliveryType): void
    {
        $this->deleted[] = $publicId;
    }
}
