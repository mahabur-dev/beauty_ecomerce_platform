<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Review\Models\ReviewReply;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReviewReply */
final class ReviewReplyResource extends JsonResource
{
    public function __construct(
        ReviewReply $resource,
        private readonly bool $includeAdminMetadata = false,
    ) {
        parent::__construct($resource);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => (int) $this->getKey(),
            'body' => $this->body,
            'author_name' => $this->author !== null ? $this->author->name : 'GlowCare Team',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        if ($this->includeAdminMetadata) {
            $data['admin_user_id'] = (int) $this->admin_user_id;
            $data['author'] = $this->whenLoaded('author', fn () => $this->author === null ? null : [
                'id' => (int) $this->author->getKey(),
                'name' => $this->author->name,
            ]);
        }

        return $data;
    }
}
