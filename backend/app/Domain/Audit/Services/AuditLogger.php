<?php

namespace App\Domain\Audit\Services;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Models\User;

final class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function record(
        ?User $actor,
        string $action,
        string $subjectType,
        int $subjectId,
        ?array $before = null,
        ?array $after = null,
        ?string $ipAddress = null,
    ): AuditLog {
        $log = new AuditLog([
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'before_json' => $before,
            'after_json' => $after,
            'ip_address' => $ipAddress,
        ]);

        $log->actor()->associate($actor);
        $log->save();

        return $log;
    }
}
