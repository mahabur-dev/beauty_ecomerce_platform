<?php

return [
    'rate_limits' => [
        'read_per_minute' => (int) env('CATALOG_READ_RATE_LIMIT', 120),
        'write_per_minute' => (int) env('CATALOG_WRITE_RATE_LIMIT', 20),
    ],
];
