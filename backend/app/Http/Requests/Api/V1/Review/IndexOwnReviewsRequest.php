<?php

namespace App\Http\Requests\Api\V1\Review;

use App\Domain\Review\Enums\ReviewStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexOwnReviewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'product_slug' => ['nullable', 'string', 'max:240'],
            'product_id' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', Rule::enum(ReviewStatus::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
