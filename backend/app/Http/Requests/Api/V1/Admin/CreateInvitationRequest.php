<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Domain\Identity\Enums\RoleCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:255'],
            'role' => ['required', Rule::enum(RoleCode::class)->only([RoleCode::SuperAdmin, RoleCode::CatalogManager])],
            'vendor_id' => ['nullable', 'integer', 'exists:vendors,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }
}
