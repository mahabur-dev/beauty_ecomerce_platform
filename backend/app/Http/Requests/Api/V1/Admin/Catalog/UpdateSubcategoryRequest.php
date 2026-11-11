<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Domain\Catalog\Models\Category;
use App\Domain\Shared\Enums\RecordStatus;
use App\Http\Requests\Concerns\NormalizesSlug;
use App\Http\Requests\Concerns\ValidatesImageUpload;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSubcategoryRequest extends FormRequest
{
    use NormalizesSlug, ValidatesImageUpload;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $subcategory = $this->route('subcategory');

        return [
            'category_id' => [
                'sometimes',
                'integer',
                Rule::exists('categories', 'id')->where(
                    fn (Builder $query): Builder => $query
                        ->whereNull('parent_id')
                        ->whereNull('deleted_at')
                        ->where('status', RecordStatus::Active->value),
                ),
            ],
            'name' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories', 'slug')->ignore($subcategory instanceof Category ? $subcategory : null)],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'status' => ['sometimes', Rule::enum(RecordStatus::class)],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:4294967295'],
            'image' => $this->imageUploadRules(false),
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeSlugFromName();
    }
}
