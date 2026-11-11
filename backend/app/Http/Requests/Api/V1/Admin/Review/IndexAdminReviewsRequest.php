<?php

namespace App\Http\Requests\Api\V1\Admin\Review;

use App\Domain\Review\Enums\ReviewStatus;
use App\Http\Requests\Concerns\NormalizesBooleanQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexAdminReviewsRequest extends FormRequest
{
    use NormalizesBooleanQuery;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:220'],
            'status' => ['nullable', Rule::enum(ReviewStatus::class)],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'with_media' => ['nullable', 'boolean'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'trash' => ['nullable', Rule::in(['without', 'with', 'only'])],
            'sort' => ['nullable', Rule::in(['newest', 'oldest', 'highest', 'lowest'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeBooleanField('with_media');
    }
}
