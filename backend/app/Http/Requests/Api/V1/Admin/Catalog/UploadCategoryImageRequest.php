<?php

namespace App\Http\Requests\Api\V1\Admin\Catalog;

use App\Http\Requests\Concerns\ValidatesImageUpload;
use Illuminate\Foundation\Http\FormRequest;

final class UploadCategoryImageRequest extends FormRequest
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
        ];
    }
}
