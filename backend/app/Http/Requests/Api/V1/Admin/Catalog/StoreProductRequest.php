<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Enums\ProductStatus;
use App\Http\Requests\Concerns\NormalizesSlug;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreProductRequest extends FormRequest
{
    use NormalizesSlug;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'subcategory_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:220'],
            'slug' => ['required', 'string', 'max:240', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('products', 'slug')],
            'description' => ['required', 'string', 'max:100000'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', Rule::enum(ProductStatus::class)],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:320'],
            'variants' => ['required', 'array', 'min:1', 'max:100'],
            'variants.*.sku' => ['nullable', 'string', 'max:80', 'distinct', Rule::unique('product_variants', 'sku')],
            'variants.*.barcode' => ['nullable', 'string', 'max:100', 'distinct', Rule::unique('product_variants', 'barcode')],
            'variants.*.title' => ['required', 'string', 'max:160'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'variants.*.is_default' => ['required', 'boolean'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
            'variants.*.attribute_value_ids' => ['sometimes', 'array'],
            'variants.*.attribute_value_ids.*' => ['integer', 'exists:attribute_values,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeSlugFromName();

        if (! $this->has('variants') && $this->filled('new_price')) {
            $this->merge(['variants' => [[
                'sku' => $this->input('sku'),
                'title' => 'Default',
                'price' => $this->input('new_price'),
                'compare_at_price' => $this->input('old_price'),
                'is_default' => true,
                'is_active' => true,
                'attribute_value_ids' => [],
            ]]]);
        }
    }
}
