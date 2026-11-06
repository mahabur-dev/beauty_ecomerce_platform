<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

final class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_returns_service_metadata_and_request_id(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertHeader('Content-Type', 'application/json')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('X-Request-ID')
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.service', 'Beauty Commerce API')
            ->assertJsonPath('data.version', '0.1.0')
            ->assertJsonStructure([
                'data' => ['status', 'service', 'version', 'timestamp'],
            ]);
    }

    public function test_unknown_api_route_uses_problem_details_response(): void
    {
        $response = $this->getJson('/api/v1/not-a-real-route');

        $response
            ->assertNotFound()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertHeader('X-Request-ID')
            ->assertJsonPath('type', 'about:blank')
            ->assertJsonPath('title', 'Not Found')
            ->assertJsonPath('status', 404)
            ->assertJsonPath('instance', '/api/v1/not-a-real-route')
            ->assertJsonStructure([
                'type',
                'title',
                'status',
                'detail',
                'instance',
                'request_id',
            ]);
    }
}
