<?php

return [
    'image' => [
        'max_count' => 5,
        'max_bytes' => 5 * 1024 * 1024,
        'formats' => ['jpg', 'jpeg', 'png', 'webp'],
    ],
    'video' => [
        'enabled' => (bool) env('REVIEW_VIDEO_ENABLED', false),
        'max_count' => 1,
        'max_bytes' => 30 * 1024 * 1024,
        'max_duration_seconds' => 30,
        'formats' => ['mp4', 'webm'],
    ],
    'upload_intent_ttl_minutes' => 10,
    'delivery_url_ttl_seconds' => 300,
    'rate_limits' => [
        'read_per_minute' => 120,
        'write_per_minute' => 20,
        'media_per_minute' => 10,
    ],
];
