<?php

namespace App\Http\Requests\Api\V1\Admin\Review;

use App\Domain\Review\Enums\ReviewStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ModerateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    ReviewStatus::Approved->value,
                    ReviewStatus::Rejected->value,
                    ReviewStatus::Hidden->value,
                ]),
            ],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'lock_version' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
