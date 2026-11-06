<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
final class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getKey(),
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->email_verified_at !== null,
            'is_active' => $this->is_active,
            'vendor_id' => $this->vendor_id,
            'roles' => $this->roles->pluck('code')->map(fn ($code) => $code->value)->values(),
            'mfa_enabled' => $this->mfaSetting?->confirmed_at !== null,
        ];
    }
}
