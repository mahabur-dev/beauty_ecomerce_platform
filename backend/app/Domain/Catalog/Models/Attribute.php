<?php

namespace App\Domain\Catalog\Models;

use Database\Factories\AttributeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Attribute extends Model
{
    /** @use HasFactory<AttributeFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['code', 'name'];

    /** @return HasMany<AttributeValue, $this> */
    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }
}
