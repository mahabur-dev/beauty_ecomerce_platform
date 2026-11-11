<?php

namespace App\Http\Requests\Api\V1\Review;

use App\Http\Requests\Concerns\NormalizesBooleanQuery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexPublicReviewsRequest extends FormRequest
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
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'with_media' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['newest', 'highest', 'lowest'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeBooleanField('with_media');
    }
}
