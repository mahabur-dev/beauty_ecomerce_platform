<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Http\Requests\Concerns\ValidatesImageUpload;
use Illuminate\Foundation\Http\FormRequest;

final class UploadProductImageRequest extends FormRequest
{
    use ValidatesImageUpload;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'image' => $this->imageUploadRules(),
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:4294967295'],
            'is_primary' => ['sometimes', 'boolean'],
        ];
    }
}
