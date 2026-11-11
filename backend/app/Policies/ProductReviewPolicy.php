<?php

namespace App\Policies;

use App\Domain\Identity\Enums\RoleCode;
use App\Domain\Identity\Models\User;
use App\Domain\Review\Models\ProductReview;

final class ProductReviewPolicy
{
    public function create(User $user): bool
    {
        return $user->is_active && $user->hasVerifiedEmail();
    }

    public function viewOwn(User $user, ProductReview $review): bool
    {
        return $this->isVerifiedOwner($user, $review);
    }

    public function update(User $user, ProductReview $review): bool
    {
        return $this->isVerifiedOwner($user, $review);
    }

    public function delete(User $user, ProductReview $review): bool
    {
        return $this->isVerifiedOwner($user, $review);
    }

    public function manageMedia(User $user, ProductReview $review): bool
    {
        return $this->isVerifiedOwner($user, $review);
    }

    public function viewAny(User $user): bool
    {
        return $this->isActiveAdministrator($user);
    }

    public function viewAsAdmin(User $user, ProductReview $review): bool
    {
        return $this->canManageVendorReview($user, $review);
    }

    public function moderate(User $user, ProductReview $review): bool
    {
        return $this->canManageVendorReview($user, $review);
    }

    public function reply(User $user, ProductReview $review): bool
    {
        return $this->canManageVendorReview($user, $review);
    }

    private function isVerifiedOwner(User $user, ProductReview $review): bool
    {
        return $user->is_active
            && $user->hasVerifiedEmail()
            && (int) $review->user_id === (int) $user->getKey();
    }

    private function isActiveAdministrator(User $user): bool
    {
        if (! $user->is_active) {
            return false;
        }

        if ($user->hasRole(RoleCode::SuperAdmin)) {
            return true;
        }

        return $user->hasRole(RoleCode::CatalogManager) && $user->vendor_id !== null;
    }

    private function canManageVendorReview(User $user, ProductReview $review): bool
    {
        if (! $user->is_active) {
            return false;
        }

        if ($user->hasRole(RoleCode::SuperAdmin)) {
            return true;
        }

        return $user->hasRole(RoleCode::CatalogManager)
            && $user->vendor_id !== null
            && (int) $user->vendor_id === (int) $review->vendor_id;
    }
}
