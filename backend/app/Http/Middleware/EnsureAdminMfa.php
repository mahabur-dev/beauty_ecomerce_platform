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
        /*
        // [MFA FEATURE - TEMPORARILY DISABLED]
        // Uncomment this block when re-enabling MFA:
        $key = (string) config('identity.mfa_verified_session_key');

        if (! $request->session()->has($key)) {
            throw new IdentityRuleException('A completed MFA challenge is required.', 403, 'MFA required');
        }
        */

        return $next($request);
    }
}
