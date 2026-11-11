<?php

namespace App\Domain\Catalog\Models;

use App\Domain\Shared\Enums\RecordStatus;
use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'status',
        'sort_order',
    ];

    /** @return BelongsTo<Category, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<Category, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** @return BelongsToMany<Product, $this> */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_categories');
    }

    /** @return HasMany<Product, $this> */
    public function primaryProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'primary_category_id');
    }

    public function hasImage(): bool
    {
        return $this->image_url !== null && $this->image_storage_path !== null;
    }

    /** @return array{public_id: string, resource_type: string, delivery_type: string}|null */
    public function imageLocator(): ?array
    {
        if ($this->image_storage_path === null || $this->image_storage_path === '') {
            return null;
        }

        return [
            'public_id' => $this->image_storage_path,
            'resource_type' => $this->image_resource_type ?? 'image',
            'delivery_type' => $this->image_delivery_type ?? 'upload',
        ];
    }

    /** @return array<string, int|string|null>|null */
    public function imagePayload(bool $includeBytes = false): ?array
    {
        if ($this->image_url === null || $this->image_url === '') {
            return null;
        }

        $payload = [
            'url' => $this->image_url,
            'format' => $this->image_format,
            'width' => $this->image_width,
            'height' => $this->image_height,
        ];

        if ($includeBytes) {
            $payload['bytes'] = $this->image_bytes;
        }

        return $payload;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'parent_id' => 'integer',
            'sort_order' => 'integer',
            'image_bytes' => 'integer',
            'image_width' => 'integer',
            'image_height' => 'integer',
            'status' => RecordStatus::class,
        ];
    }
}
