"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  MessageSquareText,
  SlidersHorizontal,
  Star,
  UserCheck,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { EmptyState } from "@/components/feedback";
import {
  Alert,
  Button,
  buttonStyles,
  DismissibleAlert,
  Modal,
  SelectDropdown,
  Skeleton,
} from "@/components/ui";
import { env } from "@/config/env";
import { buildLoginHrefForLocation, useCurrentUser } from "@/features/auth/client";
import { cn } from "@/lib/utils/cn";

import {
  deleteProductReview,
  deleteReviewMedia,
  getMyReviewById,
  refreshReviewMediaUrl,
} from "../api";
import {
  REVIEW_DEFAULT_PAGE_SIZE,
  REVIEW_SORT_OPTIONS,
} from "../constants";
import { getReviewErrorMessage } from "../errors";
import {
  invalidateProductReviewQueries,
  reviewQueryKeys,
  useMyProductReview,
  useProductReviews,
  useProductReviewSummary,
} from "../hooks";
import type {
  OwnReview,
  PublicReview,
  ReviewMediaItem,
  ReviewSort,
} from "../types";
import { EMPTY_REVIEW_SUMMARY, toPublicReviewShape } from "../utils";
import { RatingSummary } from "./rating-summary";
import { ReviewCard } from "./review-card";
import { ReviewComposer } from "./review-composer";
import { useMediaUploadQueue } from "./use-media-upload-queue";

export interface ProductReviewsSectionProps {
  productSlug: string;
  productName: string;
}

function visiblePages(current: number, last: number): number[] {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
}

function GuestSignInButton({ fallbackSlug }: { fallbackSlug: string }) {
  const pathname = usePathname() || `/products/${fallbackSlug}`;
  const searchParams = useSearchParams();
  const loginHref = buildLoginHrefForLocation(
    pathname,
    searchParams?.toString() ?? "",
    searchParams?.get("next") ?? null,
  );

  return (
    <Link
      href={loginHref as Route}
      className={buttonStyles({
        variant: "primary",
        size: "md",
        className: "font-bold",
      })}
    >
      Sign in to write a review
    </Link>
  );
}

export function ProductReviewsSection({
  productSlug,
  productName,
}: ProductReviewsSectionProps) {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [withMediaOnly, setWithMediaOnly] = useState(false);
  const [myReviewOnly, setMyReviewOnly] = useState(false);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [page, setPage] = useState(1);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isEditingOwn, setIsEditingOwn] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removingMediaId, setRemovingMediaId] = useState<number | null>(null);
  const [ownCardError, setOwnCardError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const userQuery = useCurrentUser();
  const user = userQuery.data ?? null;
  const isVerifiedCustomer = Boolean(user && user.email_verified);

  const summaryQuery = useProductReviewSummary(productSlug);
  const reviewsQuery = useProductReviews(productSlug, {
    rating: ratingFilter,
    withMedia: withMediaOnly,
    sort,
    page,
    perPage: REVIEW_DEFAULT_PAGE_SIZE,
  });
  const ownReviewQuery = useMyProductReview(productSlug, isVerifiedCustomer);
  const uploader = useMediaUploadQueue();

  const summary =
    reviewsQuery.data?.summary ?? summaryQuery.data ?? EMPTY_REVIEW_SUMMARY;
  const reviews = reviewsQuery.data?.data ?? [];
  const meta = reviewsQuery.data?.meta;
  const ownReview = ownReviewQuery.data ?? null;

  const showMyReviewFilter = isVerifiedCustomer && ownReview !== null;
  const effectiveMyReviewOnly = myReviewOnly && ownReview !== null;
  const hasActiveFilters =
    ratingFilter !== null || withMediaOnly || effectiveMyReviewOnly;

  const ownReviewMatchesFilters =
    ownReview !== null &&
    (ratingFilter === null || ownReview.rating === ratingFilter) &&
    (!withMediaOnly || ownReview.media.length > 0);

  // Public endpoint returns approved reviews only; blend customer's non-approved review into page 1 when filters match.
  const prependUnapprovedOwn =
    !effectiveMyReviewOnly &&
    ownReview !== null &&
    ownReview.status !== "approved" &&
    page === 1 &&
    ownReviewMatchesFilters &&
    !reviews.some((item) => item.id === ownReview.id);

  const displayedReviews: PublicReview[] = (() => {
    if (effectiveMyReviewOnly) {
      if (!ownReview || !ownReviewMatchesFilters) {
        return [];
      }
      return [toPublicReviewShape(ownReview, user?.name ?? "You")];
    }

    if (prependUnapprovedOwn && ownReview) {
      return [toPublicReviewShape(ownReview, user?.name ?? "You"), ...reviews];
    }

    return reviews;
  })();

  function handleSelectRatingFilter(nextRating: number | null) {
    setRatingFilter(nextRating);
    setPage(1);
  }

  function handleToggleWithMedia() {
    setWithMediaOnly((prev) => !prev);
    setPage(1);
  }

  function handleToggleMyReview() {
    setMyReviewOnly((prev) => !prev);
    setPage(1);
  }

  function handleSortChange(nextSort: ReviewSort) {
    setSort(nextSort);
    setPage(1);
  }

  function handleClearFilters() {
    setRatingFilter(null);
    setWithMediaOnly(false);
    setMyReviewOnly(false);
    setSort("newest");
    setPage(1);
  }

  async function handleRefreshOwnMediaUrl(
    mediaId: number,
  ): Promise<ReviewMediaItem | null> {
    if (!ownReview) return null;
    const updatedMedia = await refreshReviewMediaUrl(ownReview.id, mediaId);

    queryClient.setQueryData<OwnReview | null>(
      reviewQueryKeys.mine(productSlug),
      (current) => {
        if (!current) return current;
        return {
          ...current,
          media: current.media.map((item) =>
            item.id === updatedMedia.id ? updatedMedia : item,
          ),
        };
      },
    );

    return updatedMedia;
  }

  async function handleReloadLatestOwnReview() {
    if (!ownReview) return;
    const latest = await getMyReviewById(ownReview.id);
    queryClient.setQueryData<OwnReview | null>(
      reviewQueryKeys.mine(productSlug),
      latest,
    );
    await invalidateProductReviewQueries(queryClient, productSlug);
  }

  async function handleRemoveOwnMediaDirect(mediaId: number) {
    if (!ownReview) return;
    setRemovingMediaId(mediaId);
    setOwnCardError(null);
    try {
      await deleteReviewMedia(ownReview.id, mediaId);
      await invalidateProductReviewQueries(queryClient, productSlug);
      setNoticeMessage(
        ownReview.status === "approved"
          ? "Media removed. Your review was moved back to pending moderation."
          : "Media removed from your review.",
      );
    } catch (error) {
      setOwnCardError(getReviewErrorMessage(error));
    } finally {
      setRemovingMediaId(null);
    }
  }

  async function handleConfirmDeleteOwn() {
    if (!ownReview) return;
    setIsDeleting(true);
    setOwnCardError(null);
    try {
      await deleteProductReview(ownReview.id);
      uploader.resetQueue();
      setIsDeleteModalOpen(false);
      setIsEditingOwn(false);
      setMyReviewOnly(false);
      setIsComposerOpen(false);
      await invalidateProductReviewQueries(queryClient, productSlug);
      setNoticeMessage(
        "Your review has been deleted. You can submit a new review whenever you are ready.",
      );
    } catch (error) {
      setOwnCardError(getReviewErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  function renderOwnEditComposer(targetReview: OwnReview) {
    return (
      <ReviewComposer
        key={`edit-${targetReview.id}-v${targetReview.lock_version}`}
        productSlug={productSlug}
        productName={productName}
        mode="edit"
        initialReview={targetReview}
        uploader={uploader}
        onRefreshMediaUrl={handleRefreshOwnMediaUrl}
        onReloadConflictReview={handleReloadLatestOwnReview}
        onCancel={() => setIsEditingOwn(false)}
        onSuccess={(_, message, keepEditorOpen) => {
          setNoticeMessage(message);
          if (!keepEditorOpen) {
            setIsEditingOwn(false);
          }
        }}
      />
    );
  }

  const sortOptions = REVIEW_SORT_OPTIONS.map((option) => ({
    value: option.value as ReviewSort,
    label: option.label,
  }));

  const paginationPages =
    !effectiveMyReviewOnly && meta && meta.last_page > 1
      ? visiblePages(meta.current_page, meta.last_page)
      : [];

  const ownEditRenderedInline =
    isEditingOwn &&
    ownReview !== null &&
    ownReview.status !== "hidden" &&
    displayedReviews.some((item) => item.id === ownReview.id);

  const countSummaryLabel = (() => {
    if (effectiveMyReviewOnly) {
      return "Showing 1–1 of 1 review";
    }
    if (!meta) {
      return null;
    }
    const extraOwn = prependUnapprovedOwn ? 1 : 0;
    const totalCount = meta.total + extraOwn;
    const fromCount =
      prependUnapprovedOwn && meta.total === 0 ? 1 : (meta.from ?? 1);
    const toCount = prependUnapprovedOwn
      ? (meta.to ?? 0) + 1
      : (meta.to ?? reviews.length);

    return `Showing ${fromCount}–${toCount} of ${totalCount} ${totalCount === 1 ? "review" : "reviews"}`;
  })();

  return (
    <section
      id="product-reviews"
      aria-labelledby="product-reviews-heading"
      className="scroll-mt-36 space-y-8 lg:scroll-mt-28"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="product-reviews-heading"
            className="text-ink text-2xl font-extrabold sm:text-3xl"
          >
            Customer Reviews &amp; Ratings
          </h2>
          <p className="text-ink-muted mt-1 text-sm">
            Verified customer feedback and real results for {productName}.
          </p>
        </div>

        {isVerifiedCustomer && !ownReview && !ownReviewQuery.isLoading ? (
          <Button
            type="button"
            variant={isComposerOpen ? "outline" : "primary"}
            size="lg"
            leftIcon={<MessageSquarePlus className="size-4" aria-hidden="true" />}
            onClick={() => {
              setNoticeMessage(null);
              setIsComposerOpen((prev) => !prev);
            }}
          >
            {isComposerOpen ? "Close Review Form" : "Write a Review"}
          </Button>
        ) : null}
      </div>

      {/* Product Rating Summary & Star Distribution */}
      <RatingSummary
        summary={summary}
        activeRating={ratingFilter}
        onSelectRating={handleSelectRatingFilter}
      />

      {/* Customer Status / Notice Banner */}
      {noticeMessage ? (
        <DismissibleAlert
          tone="success"
          onDismiss={() => setNoticeMessage(null)}
        >
          {noticeMessage}
        </DismissibleAlert>
      ) : null}

      {/* Auth / Eligibility / Create Composer Area */}
      {userQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-3xl" />
      ) : !user ? (
        <div className="border-line bg-surface-subtle flex flex-col items-start justify-between gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-ink text-base font-bold">
              Have you tried {productName}?
            </h3>
            <p className="text-ink-muted mt-1 text-sm">
              Sign in with your GlowCare customer account to leave a star rating
              {env.reviewVideoEnabled ? ", photos, or video." : " or photos."}
            </p>
          </div>
          <Suspense
            fallback={
              <Link
                href={buildLoginHrefForLocation(`/products/${productSlug}`) as Route}
                className={buttonStyles({
                  variant: "primary",
                  size: "md",
                  className: "font-bold",
                })}
              >
                Sign in to write a review
              </Link>
            }
          >
            <GuestSignInButton fallbackSlug={productSlug} />
          </Suspense>
        </div>
      ) : !user.email_verified ? (
        <Alert
          tone="info"
          title="Email verification required"
          action={
            <Link
              href={"/verify-email" as Route}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Verify email
            </Link>
          }
        >
          Please verify your email address before submitting a review for this
          product.
        </Alert>
      ) : isComposerOpen && !ownReview ? (
        <ReviewComposer
          productSlug={productSlug}
          productName={productName}
          mode="create"
          uploader={uploader}
          onCancel={() => {
            uploader.resetQueue();
            setIsComposerOpen(false);
          }}
          onSuccess={(_, message) => {
            setIsComposerOpen(false);
            setNoticeMessage(message);
          }}
        />
      ) : isEditingOwn && ownReview && ownReview.status !== "hidden" && !ownEditRenderedInline ? (
        renderOwnEditComposer(ownReview)
      ) : null}

      {/* Filter & Sort Controls */}
      <div className="border-line bg-surface-elevated/70 flex flex-col justify-between gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter customer reviews"
        >
          <span className="text-ink-muted mr-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Filter:
          </span>

          <button
            type="button"
            aria-pressed={ratingFilter === null}
            onClick={() => handleSelectRatingFilter(null)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              ratingFilter === null
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-surface-elevated text-ink hover:border-brand-200 hover:bg-brand-50",
            )}
          >
            All ratings
          </button>

          {[5, 4, 3, 2, 1].map((stars) => {
            const isActive = ratingFilter === stars;
            return (
              <button
                key={stars}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  handleSelectRatingFilter(isActive ? null : stars)
                }
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line bg-surface-elevated text-ink hover:border-brand-200 hover:bg-brand-50",
                )}
              >
                <span>{stars}</span>
                <Star
                  className={cn(
                    "size-3",
                    isActive
                      ? "fill-white text-white"
                      : "fill-amber-400 text-amber-400",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}

          <button
            type="button"
            aria-pressed={withMediaOnly}
            onClick={handleToggleWithMedia}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              withMediaOnly
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-surface-elevated text-ink hover:border-brand-200 hover:bg-brand-50",
            )}
          >
            <Camera className="size-3.5" aria-hidden="true" />
            <span>
              {env.reviewVideoEnabled ? "With photos & video" : "With photos"}
            </span>
          </button>

          {showMyReviewFilter ? (
            <button
              type="button"
              aria-pressed={effectiveMyReviewOnly}
              onClick={handleToggleMyReview}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                effectiveMyReviewOnly
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-surface-elevated text-ink hover:border-brand-200 hover:bg-brand-50",
              )}
            >
              <UserCheck className="size-3.5" aria-hidden="true" />
              <span>My review</span>
            </button>
          ) : null}

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <span className="text-ink-muted shrink-0 text-xs font-semibold">
            Sort by
          </span>
          <SelectDropdown
            value={sort}
            onChange={handleSortChange}
            options={sortOptions}
            aria-label="Sort customer reviews"
            fullWidth={false}
            align="right"
          />
        </div>
      </div>

      {/* Unified Review List */}
      {!effectiveMyReviewOnly && reviewsQuery.isLoading ? (
        <div className="space-y-4" aria-label="Loading customer reviews">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : !effectiveMyReviewOnly && reviewsQuery.isError ? (
        <Alert
          tone="error"
          title="Could not load customer reviews"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void reviewsQuery.refetch()}
            >
              Try again
            </Button>
          }
        >
          {getReviewErrorMessage(reviewsQuery.error)}
        </Alert>
      ) : displayedReviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title={
            hasActiveFilters
              ? "No reviews match these filters"
              : "No approved reviews yet"
          }
          description={
            hasActiveFilters
              ? "Try clearing one or more filters to view all published customer feedback."
              : `Be the first shopper to review ${productName}.`
          }
          action={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
              >
                Show all reviews
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {countSummaryLabel ? (
            <p className="text-ink-muted text-xs font-medium">
              {countSummaryLabel}
            </p>
          ) : null}

          <div className="space-y-4">
            {displayedReviews.map((review) => {
              const isOwn = ownReview !== null && review.id === ownReview.id;

              if (isOwn && ownReview) {
                if (isEditingOwn && ownReview.status !== "hidden") {
                  return renderOwnEditComposer(ownReview);
                }

                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    ownerReview={ownReview}
                    onEdit={() => {
                      setOwnCardError(null);
                      uploader.clearValidationErrors();
                      setIsEditingOwn(true);
                    }}
                    onDelete={() => setIsDeleteModalOpen(true)}
                    onRefreshMediaUrl={handleRefreshOwnMediaUrl}
                    onRemoveMedia={(mediaId) =>
                      void handleRemoveOwnMediaDirect(mediaId)
                    }
                    removingMediaId={removingMediaId}
                    uploader={uploader}
                    cardError={ownCardError}
                    onDismissCardError={() => setOwnCardError(null)}
                    onRetryQueueItem={(localId) => {
                      void uploader
                        .retryItem(localId, ownReview.id, ownReview.media.length)
                        .then((res) => {
                          if (res.ok) {
                            void invalidateProductReviewQueries(
                              queryClient,
                              productSlug,
                            );
                          }
                        });
                    }}
                  />
                );
              }

              return <ReviewCard key={review.id} review={review} />;
            })}
          </div>

          {!effectiveMyReviewOnly && meta && meta.last_page > 1 ? (
            <nav
              aria-label="Review pages"
              className="flex flex-wrap items-center justify-center gap-2 pt-4"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1}
                leftIcon={<ChevronLeft className="size-4" aria-hidden="true" />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              {paginationPages.map((pageNum, idx) => {
                const prevPage = paginationPages[idx - 1];
                return (
                  <span key={pageNum} className="contents">
                    {prevPage !== undefined && pageNum - prevPage > 1 ? (
                      <span
                        className="text-ink-muted px-1"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant={
                        pageNum === meta.current_page ? "primary" : "outline"
                      }
                      size="sm"
                      aria-current={
                        pageNum === meta.current_page ? "page" : undefined
                      }
                      className="min-w-9 px-3"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  </span>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                rightIcon={
                  <ChevronRight className="size-4" aria-hidden="true" />
                }
                onClick={() =>
                  setPage((p) => Math.min(meta.last_page, p + 1))
                }
              >
                Next
              </Button>
            </nav>
          ) : null}
        </div>
      )}

      {ownReview && isDeleteModalOpen ? (
        <Modal
          open={isDeleteModalOpen}
          onOpenChange={(open) => {
            if (!isDeleting) setIsDeleteModalOpen(open);
          }}
          title="Delete your review?"
          description="This permanently removes your review, moderation history, and attached media for this product. You can submit a new review afterward."
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Keep review
              </Button>
              <Button
                type="button"
                variant="danger"
                isLoading={isDeleting}
                loadingText="Deleting…"
                onClick={() => void handleConfirmDeleteOwn()}
              >
                Delete review
              </Button>
            </div>
          }
        >
          <p className="text-ink-muted text-sm leading-relaxed">
            Are you sure you want to delete your review for{" "}
            <strong className="text-ink">{productName}</strong>? This action
            cannot be undone.
          </p>
        </Modal>
      ) : null}
    </section>
  );
}

