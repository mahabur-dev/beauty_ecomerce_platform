<?php

namespace App\Jobs;

use App\Domain\Media\Contracts\MediaStorage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class DeleteMediaAsset implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [10, 60, 300, 900];

    public function __construct(
        public readonly string $publicId,
        public readonly string $resourceType,
        public readonly string $deliveryType,
    ) {
        $this->afterCommit();
    }

    public function handle(MediaStorage $storage): void
    {
        $storage->delete($this->publicId, $this->resourceType, $this->deliveryType);
    }
}
