<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ProblemDetailsResponseFactory
{
    /**
     * @param  array<string, mixed>  $extensions
     */
    public function make(
        Request $request,
        int $status,
        string $title,
        string $detail,
        array $extensions = [],
    ): JsonResponse {
        $problem = [
            'type' => 'about:blank',
            'title' => $title,
            'status' => $status,
            'detail' => $detail,
            'instance' => '/'.$request->path(),
            'request_id' => $request->attributes->getString('request_id'),
            ...$extensions,
        ];

        return response()->json(
            data: $problem,
            status: $status,
            headers: ['Content-Type' => 'application/problem+json'],
        );
    }
}
