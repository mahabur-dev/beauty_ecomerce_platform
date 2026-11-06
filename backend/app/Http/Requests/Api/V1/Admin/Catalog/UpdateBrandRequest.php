<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Models\Brand;
use App\Domain\Shared\Enums\RecordStatus;
use App\Http\Requests\Concerns\NormalizesSlug;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateBrandRequest extends FormRequest
{
    use NormalizesSlug;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $brand = $this->route('brand');

        return [
            'name' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('brands', 'slug')->ignore($brand instanceof Brand ? $brand : null)],
            'status' => ['sometimes', Rule::enum(RecordStatus::class)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeSlugFromName();
    }
}
