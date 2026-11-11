<?php

return [
    'admin_frontend_url' => env('ADMIN_FRONTEND_URL', 'http://localhost:3001'),
    'storefront_url' => env('STOREFRONT_URL', 'http://localhost:3000'),
    'invitation_ttl_hours' => (int) env('ADMIN_INVITATION_TTL_HOURS', 48),
    'mfa_enabled' => (bool) env('ADMIN_MFA_ENABLED', false),
    'super_admin' => [
        'email' => env('SUPER_ADMIN_EMAIL'),
        'name' => env('SUPER_ADMIN_NAME'),
        'password' => env('SUPER_ADMIN_PASSWORD'),
    ],
    'pending_admin_session_key' => 'identity.pending_admin_user_id',
    'mfa_verified_session_key' => 'identity.mfa_verified_at',
];
