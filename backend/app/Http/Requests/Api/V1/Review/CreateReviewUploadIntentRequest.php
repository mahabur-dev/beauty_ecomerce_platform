<?php

namespace App\Http\Requests\Api\V1\Review;

use App\Domain\Review\Enums\ReviewMediaKind;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateReviewUploadIntentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::enum(ReviewMediaKind::class)],
            'format' => ['required', 'string', 'max:20'],
            'mime_type' => ['required', 'string', 'max:100'],
            'bytes' => ['required', 'integer', 'min:1'],
            'duration_seconds' => ['nullable', 'numeric', 'gt:0'],
        ];
    }
}
