<?php

namespace App\Http\Requests\Api\V1\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexPublicProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:220'],
            'category' => ['nullable', 'string', 'max:180'],
            'subcategory' => ['nullable', 'string', 'max:180'],
            'brand' => ['nullable', 'string', 'max:180'],
            'attribute_value_ids' => ['nullable', 'array', 'max:50'],
            'attribute_value_ids.*' => ['integer', 'distinct', 'exists:attribute_values,id'],
            'min_price' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'decimal:0,2', 'gte:min_price'],
            'sort' => ['nullable', Rule::in(['newest', 'price_asc', 'price_desc', 'name'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('attribute_value_ids'))) {
            $this->merge(['attribute_value_ids' => array_values(array_filter(
                explode(',', (string) $this->input('attribute_value_ids')),
                fn (string $value): bool => $value !== '',
            ))]);
        }
    }
}
