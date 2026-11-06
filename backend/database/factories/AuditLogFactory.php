<?php

namespace Database\Factories;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AuditLog> */
final class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'actor_user_id' => User::factory(),
            'action' => 'catalog.tested',
            'subject_type' => 'test_subject',
            'subject_id' => fake()->numberBetween(1, 1000),
            'before_json' => null,
            'after_json' => ['status' => 'active'],
            'ip_address' => fake()->ipv4(),
            'created_at' => now(),
        ];
    }
}
