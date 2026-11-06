<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Identity\Actions\RegenerateMfaRecoveryCodes;
use App\Domain\Identity\Actions\ResetUserMfa;
use App\Domain\Identity\Actions\SetAdministrativeRole;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ConfirmPasswordRequest;
use App\Http\Requests\Api\V1\Admin\RegenerateRecoveryCodesRequest;
use App\Http\Requests\Api\V1\Admin\SetAdministrativeRoleRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class AdminUserController extends Controller
{
    public function setRole(
        SetAdministrativeRoleRequest $request,
        User $user,
        SetAdministrativeRole $setRole,
    ): UserResource {
        /** @var User $actor */
        $actor = $request->user();
        $updated = $setRole->execute(
            $actor,
            $user,
            RoleCode::from($request->string('role')->toString()),
            $request->integer('vendor_id') ?: null,
            $request->string('current_password')->toString(),
            $request->ip(),
        );

        return new UserResource($updated->load(['roles', 'mfaSetting']));
    }

    public function resetMfa(
        ConfirmPasswordRequest $request,
        User $user,
        ResetUserMfa $reset,
    ): Response {
        /** @var User $actor */
        $actor = $request->user();
        $reset->execute(
            $actor,
            $user,
            $request->string('current_password')->toString(),
            $request->ip(),
        );

        return response()->noContent();
    }

    public function regenerateRecoveryCodes(
        RegenerateRecoveryCodesRequest $request,
        RegenerateMfaRecoveryCodes $regenerate,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        return response()->json(['recovery_codes' => $regenerate->execute(
            $user,
            $request->string('current_password')->toString(),
            $request->string('code')->toString(),
        )]);
    }
}
