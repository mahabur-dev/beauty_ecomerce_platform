<?php

namespace App\Http\Middleware;

use App\Domain\Identity\Exceptions\IdentityRuleException;
use App\Domain\Identity\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePendingAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->session()->get((string) config('identity.pending_admin_session_key'));
        $user = is_numeric($userId) ? User::query()->find((int) $userId) : null;

        if ($user === null || ! $user->is_active || ! $user->isAdministrator()) {
            $request->session()->forget((string) config('identity.pending_admin_session_key'));
            throw new IdentityRuleException('The pending administrator session is unavailable.', 401, 'Unauthenticated');
        }

        $request->attributes->set('pending_admin', $user);

        return $next($request);
    }
}
