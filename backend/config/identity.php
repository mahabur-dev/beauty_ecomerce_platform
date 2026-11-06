<?php

return [
    'admin_frontend_url' => env('ADMIN_FRONTEND_URL', 'http://localhost:3001'),
    'storefront_url' => env('STOREFRONT_URL', 'http://localhost:3000'),
    'invitation_ttl_hours' => (int) env('ADMIN_INVITATION_TTL_HOURS', 48),
    'pending_admin_session_key' => 'identity.pending_admin_user_id',
    'mfa_verified_session_key' => 'identity.mfa_verified_at',
];
