<?php

namespace App\Http\Middleware;

use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->is_active || ! $user->isAdministrator()) {
            throw new IdentityRuleException('Administrator access is required.', 403, 'Forbidden');
        }

        return $next($request);
    }
}
