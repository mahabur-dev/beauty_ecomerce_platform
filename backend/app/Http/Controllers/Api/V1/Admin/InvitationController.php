<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Identity\Actions\AcceptAdminInvitation;
use App\Domain\Identity\Actions\CreateAdminInvitation;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AcceptInvitationRequest;
use App\Http\Requests\Api\V1\Admin\CreateInvitationRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class InvitationController extends Controller
{
    public function store(CreateInvitationRequest $request, CreateAdminInvitation $create): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $invitation = $create->execute(
            $actor,
            $request->string('email')->toString(),
            RoleCode::from($request->string('role')->toString()),
            $request->integer('vendor_id') ?: null,
        );
        $role = $invitation->role()->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $invitation->getKey(),
                'email' => $invitation->email,
                'role' => (string) $role->getRawOriginal('code'),
                'vendor_id' => $invitation->vendor_id,
                'expires_at' => $invitation->expires_at,
            ],
        ], Response::HTTP_CREATED);
    }

    public function accept(AcceptInvitationRequest $request, AcceptAdminInvitation $accept): JsonResponse
    {
        $user = $accept->execute(
            $request->string('token')->toString(),
            $request->filled('name') ? $request->string('name')->toString() : null,
            $request->filled('password') ? $request->string('password')->toString() : null,
            $request->filled('current_password') ? $request->string('current_password')->toString() : null,
        );

        return response()->json([
            'message' => 'Invitation accepted. Sign in to complete mandatory MFA enrollment.',
            'user' => new UserResource($user->load(['roles', 'mfaSetting'])),
        ]);
    }
}
