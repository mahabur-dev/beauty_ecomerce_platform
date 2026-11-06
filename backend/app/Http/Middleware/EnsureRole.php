<?php

namespace App\Http\Middleware;

use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $allowed = $user instanceof User
            && collect($roles)->contains(fn (string $role): bool => $user->hasRole($role));

        if (! $allowed) {
            throw new IdentityRuleException('The required role is missing.', 403, 'Forbidden');
        }

        return $next($request);
    }
}
