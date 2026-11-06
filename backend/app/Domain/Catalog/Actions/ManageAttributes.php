<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Audit\Services\AuditLogger;
use App\Domain\Catalog\Exceptions\CatalogRuleException;
use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\AttributeValue;
use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class ManageAttributes
{
    public function __construct(private AuditLogger $auditLogger) {}

    /** @param array{code: string, name: string} $data */
    public function create(User $actor, array $data, ?string $ipAddress): Attribute
    {
        return DB::transaction(function () use ($actor, $data, $ipAddress): Attribute {
            $attribute = Attribute::query()->create($data);
            $this->auditLogger->record($actor, 'catalog.attribute_created', 'attribute', (int) $attribute->getKey(), after: $data, ipAddress: $ipAddress);

            return $attribute;
        });
    }

    /** @param array{code?: string, name?: string} $data */
    public function update(User $actor, Attribute $attribute, array $data, ?string $ipAddress): Attribute
    {
        return DB::transaction(function () use ($actor, $attribute, $data, $ipAddress): Attribute {
            $attribute = Attribute::query()->whereKey($attribute->getKey())->lockForUpdate()->firstOrFail();
            $before = $attribute->only(['code', 'name']);
            $attribute->fill($data)->save();
            $this->auditLogger->record($actor, 'catalog.attribute_updated', 'attribute', (int) $attribute->getKey(), $before, $attribute->only(['code', 'name']), $ipAddress);

            return $attribute->refresh();
        });
    }

    public function delete(User $actor, Attribute $attribute, ?string $ipAddress): void
    {
        DB::transaction(function () use ($actor, $attribute, $ipAddress): void {
            $attribute = Attribute::query()->whereKey($attribute->getKey())->lockForUpdate()->firstOrFail();

            if ($attribute->values()->exists()) {
                throw new CatalogRuleException('Delete attribute values before deleting the attribute.', 409, 'Attribute is in use');
            }

            $before = $attribute->only(['code', 'name']);
            $attribute->delete();
            $this->auditLogger->record($actor, 'catalog.attribute_deleted', 'attribute', (int) $attribute->getKey(), $before, ipAddress: $ipAddress);
        });
    }

    /** @param array{code: string, value: string} $data */
    public function createValue(User $actor, Attribute $attribute, array $data, ?string $ipAddress): AttributeValue
    {
        return DB::transaction(function () use ($actor, $attribute, $data, $ipAddress): AttributeValue {
            $attribute = Attribute::query()->whereKey($attribute->getKey())->lockForUpdate()->firstOrFail();
            $value = new AttributeValue($data);
            $attribute->values()->save($value);
            $this->auditLogger->record($actor, 'catalog.attribute_value_created', 'attribute_value', (int) $value->getKey(), after: $data, ipAddress: $ipAddress);

            return $value;
        });
    }

    /** @param array{code?: string, value?: string} $data */
    public function updateValue(User $actor, Attribute $attribute, AttributeValue $value, array $data, ?string $ipAddress): AttributeValue
    {
        $this->assertOwned($attribute, $value);

        return DB::transaction(function () use ($actor, $value, $data, $ipAddress): AttributeValue {
            $value = AttributeValue::query()->whereKey($value->getKey())->lockForUpdate()->firstOrFail();
            $before = $value->only(['attribute_id', 'code', 'value']);
            $value->fill($data)->save();
            $this->auditLogger->record($actor, 'catalog.attribute_value_updated', 'attribute_value', (int) $value->getKey(), $before, $value->only(['attribute_id', 'code', 'value']), $ipAddress);

            return $value->refresh();
        });
    }

    public function deleteValue(User $actor, Attribute $attribute, AttributeValue $value, ?string $ipAddress): void
    {
        $this->assertOwned($attribute, $value);

        DB::transaction(function () use ($actor, $value, $ipAddress): void {
            $value = AttributeValue::query()->whereKey($value->getKey())->lockForUpdate()->firstOrFail();

            if ($value->variants()->exists()) {
                throw new CatalogRuleException('An attribute value used by variants cannot be deleted.', 409, 'Attribute value is in use');
            }

            $before = $value->only(['attribute_id', 'code', 'value']);
            $value->delete();
            $this->auditLogger->record($actor, 'catalog.attribute_value_deleted', 'attribute_value', (int) $value->getKey(), $before, ipAddress: $ipAddress);
        });
    }

    private function assertOwned(Attribute $attribute, AttributeValue $value): void
    {
        if ($value->attribute_id !== $attribute->getKey()) {
            throw new CatalogRuleException('Attribute value not found.', 404, 'Attribute value not found');
        }
    }
}
