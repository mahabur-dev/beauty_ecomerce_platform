<?php

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumEnsureFrontendRequestsAreStateful;

final class EnsureFrontendRequestsAreStateful extends SanctumEnsureFrontendRequestsAreStateful
{
    /**
     * Preserve configured session cookie attributes (such as SameSite=None for
     * cross-origin SPAs) instead of overriding them with Sanctum's SameSite=Lax default.
     */
    protected function configureSecureCookieSessions(): void
    {
        config([
            'session.http_only' => (bool) config('session.http_only', true),
            'session.same_site' => config('session.same_site') ?: 'lax',
        ]);
    }
}

