<?php

namespace App\Http\Requests\Api\V1\Review;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'rating' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'body' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'lock_version' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
