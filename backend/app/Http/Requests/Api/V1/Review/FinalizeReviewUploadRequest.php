<?php

namespace App\Http\Requests\Api\V1\Review;

use Illuminate\Foundation\Http\FormRequest;

final class FinalizeReviewUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'token' => ['required', 'uuid'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ];
    }
}
