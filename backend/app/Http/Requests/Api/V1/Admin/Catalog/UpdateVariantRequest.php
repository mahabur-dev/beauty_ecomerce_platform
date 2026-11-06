<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $variant = $this->route('variant');

        return [
            'sku' => ['sometimes', 'string', 'max:80', Rule::unique('product_variants', 'sku')->ignore($variant instanceof ProductVariant ? $variant : null)],
            'barcode' => ['sometimes', 'nullable', 'string', 'max:100', Rule::unique('product_variants', 'barcode')->ignore($variant instanceof ProductVariant ? $variant : null)],
            'title' => ['sometimes', 'string', 'max:160'],
            'price' => ['sometimes', 'numeric', 'min:0', 'decimal:0,2'],
            'compare_at_price' => ['sometimes', 'nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'cost_price' => ['sometimes', 'nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'attribute_value_ids' => ['sometimes', 'array'],
            'attribute_value_ids.*' => ['integer', 'distinct', 'exists:attribute_values,id'],
        ];
    }
}
