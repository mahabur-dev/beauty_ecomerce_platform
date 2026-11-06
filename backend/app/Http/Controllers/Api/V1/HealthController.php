<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(
            data: [
                'data' => [
                    'status' => 'ok',
                    'service' => config('app.name'),
                    'version' => config('app.version'),
                    'timestamp' => now()->utc()->toIso8601String(),
                ],
            ],
            headers: ['Cache-Control' => 'no-store'],
        );
    }
}
