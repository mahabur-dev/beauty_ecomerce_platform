<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Shared\Enums\RecordStatus;
use App\Http\Requests\Concerns\NormalizesSlug;
use App\Http\Requests\Concerns\ValidatesImageUpload;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreCategoryRequest extends FormRequest
{
    use NormalizesSlug, ValidatesImageUpload;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories', 'slug')],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', Rule::enum(RecordStatus::class)],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:4294967295'],
            'image' => $this->imageUploadRules(false),
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeSlugFromName();
    }
}
