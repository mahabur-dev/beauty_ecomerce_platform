<?php

namespace App\Http\Requests\Api\V1\Admin\Review;

use Illuminate\Foundation\Http\FormRequest;

final class UpsertReviewReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ];
    }
}
