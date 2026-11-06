<?php

namespace App\Domain\Catalog\Services;

use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Product;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Domain\Shared\Enums\RecordStatus;
use App\Domain\Vendor\Models\Vendor;

final class ProductAccess
{
    public function vendorForCreation(User $actor): Vendor
    {
        if ($actor->hasRole(RoleCode::CatalogManager)) {
            $vendor = Vendor::query()
                ->whereKey($actor->vendor_id)
                ->where('status', RecordStatus::Active->value)
                ->first();
        } else {
            $vendor = Vendor::query()
                ->where('status', RecordStatus::Active->value)
                ->orderBy('id')
                ->first();
        }

        if ($vendor === null) {
            throw new CatalogRuleException('No active vendor is available for this product.', 409, 'Vendor unavailable');
        }

        return $vendor;
    }

    public function authorize(User $actor, Product $product): void
    {
        if ($actor->hasRole(RoleCode::SuperAdmin)) {
            return;
        }

        if (! $actor->hasRole(RoleCode::CatalogManager) || $actor->vendor_id !== $product->vendor_id) {
            throw new CatalogRuleException('The product is outside your vendor scope.', 403, 'Forbidden');
        }
    }
}
