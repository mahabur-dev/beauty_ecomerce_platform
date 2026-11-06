<?php

namespace Tests\Feature\Catalog;

use App\Domain\Catalog\Models\Brand;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\Role;
use App\Domain\Identity\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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
