<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Models\Attribute;
use App\Domain\Catalog\Models\AttributeValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateAttributeValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $attribute = $this->route('attribute');
        $value = $this->route('value');
        $attributeId = $attribute instanceof Attribute ? $attribute->getKey() : null;

        return [
            'code' => ['sometimes', 'string', 'max:100', 'regex:/^[a-z0-9_-]+$/', Rule::unique('attribute_values', 'code')->where('attribute_id', $attributeId)->ignore($value instanceof AttributeValue ? $value : null)],
            'value' => ['sometimes', 'string', 'max:120'],
        ];
    }
}
