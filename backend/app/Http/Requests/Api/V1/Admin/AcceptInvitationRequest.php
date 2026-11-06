<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class AcceptInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'size:64'],
            'name' => ['nullable', 'string', 'max:160'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'current_password' => ['nullable', 'string', 'max:4096'],
        ];
    }
}
