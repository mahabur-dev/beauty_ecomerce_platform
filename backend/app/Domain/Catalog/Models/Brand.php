<?php

namespace App\Domain\Catalog\Models;

use App\Domain\Shared\Enums\RecordStatus;
use Database\Factories\BrandFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Brand extends Model
{
    /** @use HasFactory<BrandFactory> */
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    protected $fillable = ['name', 'slug', 'status'];

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['status' => RecordStatus::class];
    }
}
