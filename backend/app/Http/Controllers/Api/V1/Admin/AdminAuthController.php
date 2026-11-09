<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Identity\Actions\BeginMfaEnrollment;
use App\Domain\Identity\Actions\ConfirmMfaEnrollment;
use App\Domain\Identity\Actions\VerifyMfaChallenge;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\MfaChallengeRequest;
use App\Http\Requests\Api\V1\Admin\MfaCodeRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

final class AdminAuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if ($user === null || ! $user->is_active || ! $user->isAdministrator()
            || ! Hash::check($request->string('password'), $user->password)) {
            throw new IdentityRuleException('The supplied credentials are invalid.', 422, 'Authentication failed');
        }

        if (! $user->hasVerifiedEmail()) {
            throw new IdentityRuleException('Email verification is required.', 403, 'Email verification required');
        }

        /*
        // [MFA FEATURE - TEMPORARILY DISABLED]
        // Uncomment this block when re-enabling MFA setup/challenge:
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();
        $request->session()->put((string) config('identity.pending_admin_session_key'), $user->getKey());

        return response()->json([
            'next' => $user->hasConfirmedMfa() ? 'mfa_challenge' : 'mfa_setup',
        ], Response::HTTP_ACCEPTED);
        */

        // [DIRECT LOGIN - TEMPORARY BYPASS]
        $this->completeLogin($request, $user);

        return response()->json([
            'next' => $user->hasConfirmedMfa() ? 'mfa_challenge' : 'mfa_setup',
        ], Response::HTTP_ACCEPTED);
    }

    public function setup(Request $request, BeginMfaEnrollment $begin): JsonResponse
    {
        return response()->json($begin->execute($this->pendingUser($request)));
    }

    public function confirm(MfaCodeRequest $request, ConfirmMfaEnrollment $confirm): JsonResponse
    {
        $user = $this->pendingUser($request);
        $codes = $confirm->execute($user, $request->string('code')->toString());
        $this->completeLogin($request, $user);

        return response()->json([
            'user' => new UserResource($user->load(['roles', 'mfaSetting'])),
            'recovery_codes' => $codes,
        ]);
    }

    public function challenge(MfaChallengeRequest $request, VerifyMfaChallenge $verify): JsonResponse
    {
        $user = $this->pendingUser($request);
        $verify->execute(
            $user,
            $request->filled('code') ? $request->string('code')->toString() : null,
            $request->filled('recovery_code') ? $request->string('recovery_code')->toString() : null,
        );
        $this->completeLogin($request, $user);

        return response()->json(['user' => new UserResource($user->load(['roles', 'mfaSetting']))]);
    }

    public function me(Request $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();

        return new UserResource($user->load(['roles', 'mfaSetting']));
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    private function pendingUser(Request $request): User
    {
        $user = $request->attributes->get('pending_admin');

        if (! $user instanceof User) {
            throw new IdentityRuleException('The pending administrator session is unavailable.', 401, 'Unauthenticated');
        }

        return $user;
    }

    private function completeLogin(Request $request, User $user): void
    {
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->forget((string) config('identity.pending_admin_session_key'));
        $request->session()->put((string) config('identity.mfa_verified_session_key'), now()->getTimestamp());
    }
}
