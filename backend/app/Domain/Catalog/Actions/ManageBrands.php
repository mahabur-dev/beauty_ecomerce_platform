<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Brand;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class ManageBrands
{
    public function __construct(private AuditLogger $auditLogger) {}

    /** @param array{name: string, slug: string, status?: string} $attributes */
    public function create(User $actor, array $attributes, ?string $ipAddress): Brand
    {
        return DB::transaction(function () use ($actor, $attributes, $ipAddress): Brand {
            $brand = Brand::query()->create($attributes);
            $this->auditLogger->record(
                $actor,
                'catalog.brand_created',
                'brand',
                (int) $brand->getKey(),
                after: $this->snapshot($brand),
                ipAddress: $ipAddress,
            );

            return $brand;
        });
    }

    /** @param array{name?: string, slug?: string, status?: string} $attributes */
    public function update(User $actor, Brand $brand, array $attributes, ?string $ipAddress): Brand
    {
        return DB::transaction(function () use ($actor, $brand, $attributes, $ipAddress): Brand {
            $brand = Brand::query()->whereKey($brand->getKey())->lockForUpdate()->firstOrFail();
            $before = $this->snapshot($brand);
            $brand->fill($attributes)->save();
            $this->auditLogger->record(
                $actor,
                'catalog.brand_updated',
                'brand',
                (int) $brand->getKey(),
                $before,
                $this->snapshot($brand),
                $ipAddress,
            );

            return $brand->refresh();
        });
    }

    public function delete(User $actor, Brand $brand, ?string $ipAddress): void
    {
        DB::transaction(function () use ($actor, $brand, $ipAddress): void {
            $brand = Brand::query()->whereKey($brand->getKey())->lockForUpdate()->firstOrFail();

            if (DB::table('products')->where('brand_id', $brand->getKey())->exists()) {
                throw new CatalogRuleException(
                    'A brand linked to products cannot be deleted. Deactivate it instead.',
                    409,
                    'Brand is in use',
                );
            }

            $before = $this->snapshot($brand);
            $brand->delete();
            $this->auditLogger->record(
                $actor,
                'catalog.brand_deleted',
                'brand',
                (int) $brand->getKey(),
                $before,
                ['deleted_at' => $brand->deleted_at?->toISOString()],
                $ipAddress,
            );
        });
    }

    public function restore(User $actor, int $brandId, ?string $ipAddress): Brand
    {
        return DB::transaction(function () use ($actor, $brandId, $ipAddress): Brand {
            $brand = Brand::withTrashed()->whereKey($brandId)->lockForUpdate()->firstOrFail();

            if (! $brand->trashed()) {
                throw new CatalogRuleException('The brand is not deleted.', 409, 'Brand is already active');
            }

            $brand->restore();
            $this->auditLogger->record(
                $actor,
                'catalog.brand_restored',
                'brand',
                (int) $brand->getKey(),
                ['deleted_at' => true],
                $this->snapshot($brand),
                $ipAddress,
            );

            return $brand->refresh();
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(Brand $brand): array
    {
        return $brand->only(['name', 'slug', 'status']);
    }
}
