<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreAttributeValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $attribute = $this->route('attribute');
        $attributeId = $attribute instanceof Attribute ? $attribute->getKey() : null;

        return [
            'code' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_-]+$/', Rule::unique('attribute_values', 'code')->where('attribute_id', $attributeId)],
            'value' => ['required', 'string', 'max:120'],
        ];
    }
}
