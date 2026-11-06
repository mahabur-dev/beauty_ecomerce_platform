<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateAttributeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $attribute = $this->route('attribute');

        return [
            'code' => ['sometimes', 'string', 'max:80', 'regex:/^[a-z0-9_]+$/', Rule::unique('attributes', 'code')->ignore($attribute instanceof Attribute ? $attribute : null)],
            'name' => ['sometimes', 'string', 'max:100'],
        ];
    }
}
