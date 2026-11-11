<?php

namespace App\Domain\Review\Queries;

use App\Domain\Audit\Models\AuditLog;
use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Models\ProductReview;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

final class AdminReviewQuery
{
    /**
     * @param  array{
     *   search?: string|null,
     *   status?: string|null,
     *   rating?: int|null,
     *   product_id?: int|null,
     *   with_media?: bool|null,
     *   date_from?: string|null,
     *   date_to?: string|null,
     *   trash?: string|null,
     *   sort?: string|null,
     * }  $filters
     * @return Builder<ProductReview>
     */
    public function forActor(User $actor, array $filters = []): Builder
    {
        $query = ProductReview::query()->with([
            'product:id,vendor_id,name,slug',
            'user:id,name,email',
            'moderator:id,name',
            'readyMedia',
            'reply.author:id,name',
        ]);

        if (! $actor->hasRole(RoleCode::SuperAdmin)) {
            if ($actor->vendor_id === null) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where('vendor_id', $actor->vendor_id);
            }
        }

        if (isset($filters['search']) && $filters['search'] !== '') {
            $escaped = Str::replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], (string) $filters['search']);
            $like = "%{$escaped}%";
            $query->where(fn (Builder $builder) => $builder
                ->where('title', 'like', $like)
                ->orWhere('body', 'like', $like)
                ->orWhereHas('product', fn (Builder $product) => $product
                    ->where('name', 'like', $like)
                    ->orWhere('slug', 'like', $like))
                ->orWhereHas('user', fn (Builder $user) => $user
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)));
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (string) $filters['status']);
        }

        if (isset($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        if (isset($filters['product_id'])) {
            $query->where('product_id', (int) $filters['product_id']);
        }

        if (($filters['with_media'] ?? false) === true) {
            $query->whereHas('readyMedia');
        }

        if (isset($filters['date_from']) && $filters['date_from'] !== '') {
            $query->where('submitted_at', '>=', Carbon::parse((string) $filters['date_from'])->startOfDay());
        }

        if (isset($filters['date_to']) && $filters['date_to'] !== '') {
            $query->where('submitted_at', '<=', Carbon::parse((string) $filters['date_to'])->endOfDay());
        }

        match ($filters['trash'] ?? 'without') {
            'with' => $query->withTrashed(),
            'only' => $query->onlyTrashed(),
            default => null,
        };

        return match ($filters['sort'] ?? 'newest') {
            'oldest' => $query->orderBy('id'),
            'highest' => $query->orderByDesc('rating')->orderByDesc('id'),
            'lowest' => $query->orderBy('rating')->orderByDesc('id'),
            default => $query->latest('id'),
        };
    }

    /** @return Collection<int, AuditLog> */
    public function auditTimeline(ProductReview $review): Collection
    {
        return AuditLog::query()
            ->with('actor:id,name')
            ->where('subject_type', 'product_review')
            ->where('subject_id', $review->getKey())
            ->latest('id')
            ->get();
    }
}
