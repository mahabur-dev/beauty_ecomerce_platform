<?php

namespace App\Http\Middleware;

use App\Domain\Identity\Exceptions\IdentityRuleException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdminMfa
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! (bool) config('identity.mfa_enabled')) {
            return $next($request);
        }

        $key = (string) config('identity.mfa_verified_session_key');

        if (! $request->hasSession() || ! $request->session()->has($key)) {
            throw new IdentityRuleException('A completed MFA challenge is required.', 403, 'MFA required');
        }

        return $next($request);
    }
}
