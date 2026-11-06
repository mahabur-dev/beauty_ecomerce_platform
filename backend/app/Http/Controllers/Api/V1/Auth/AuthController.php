<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Identity\Actions\RegisterCustomer;
use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterCustomerRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

final class AuthController extends Controller
{
    public function register(RegisterCustomerRequest $request, RegisterCustomer $register): JsonResponse
    {
        $user = $register->execute(
            $request->string('name')->toString(),
            $request->string('email')->toString(),
            $request->string('password')->toString(),
        );

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user->load(['roles', 'mfaSetting'])))
            ->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function login(LoginRequest $request): UserResource
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if ($user === null || ! $user->is_active || ! Hash::check($request->string('password'), $user->password)) {
            throw new IdentityRuleException('The supplied credentials are invalid.', 422, 'Authentication failed');
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return new UserResource($user->load(['roles', 'mfaSetting']));
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
        Auth::forgetGuards();

        return response()->noContent();
    }
}
