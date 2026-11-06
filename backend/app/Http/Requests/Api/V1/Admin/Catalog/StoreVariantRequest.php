<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'sku' => ['nullable', 'string', 'max:80', Rule::unique('product_variants', 'sku')],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('product_variants', 'barcode')],
            'title' => ['required', 'string', 'max:160'],
            'price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'cost_price' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'attribute_value_ids' => ['sometimes', 'array'],
            'attribute_value_ids.*' => ['integer', 'distinct', 'exists:attribute_values,id'],
        ];
    }
}
