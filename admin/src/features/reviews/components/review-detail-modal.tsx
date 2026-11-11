"use client";

import { useState } from "react";
import {
  ActionButton,
  DismissibleNotice,
  Modal,
  StatusBadge,
} from "@/components/ui/admin-primitives";
import { Icon } from "@/components/ui/icon";
import type { AdminReview } from "../contracts";
import { reviewErrorMessage } from "../errors";
import { useAdminReviewDetail } from "../queries";
import { formatReviewTimestamp } from "../utils";
import { ReviewMediaPreview } from "./review-media-preview";
import { ReviewModerationPanel } from "./review-moderation-panel";
import { ReviewReplyPanel } from "./review-reply-panel";
import { ReviewStars } from "./review-stars";

export interface ReviewDetailModalProps {
  reviewId: number;
  initialReview: AdminReview;
  canModerate: boolean;
  onClose: () => void;
  onNotice: (message: string) => void;
}

export function ReviewDetailModal({
  reviewId,
  initialReview,
  canModerate,
  onClose,
  onNotice,
}: ReviewDetailModalProps) {
  const detailQuery = useAdminReviewDetail(reviewId);
  const [modalNotice, setModalNotice] = useState("");
  const review = detailQuery.data ?? initialReview;

  function handleLocalNotice(message: string) {
    setModalNotice(message);
    onNotice(message);
  }

  return (
    <Modal
      title={`Review #${review.id}`}
      subtitle={
        review.product
          ? `${review.product.name} · /${review.product.slug}`
          : `Product #${review.product_id}`
      }
      size="wide"
      onClose={onClose}
    >
      <div className="catalog-detail-container">
        {modalNotice ? (
          <DismissibleNotice
            variant="success"
            message={modalNotice}
            onDismiss={() => setModalNotice("")}
          />
        ) : null}

        {detailQuery.isError ? (
          <DismissibleNotice
            variant="error"
            durationMs={0}
            message={reviewErrorMessage(detailQuery.error)}
          />
        ) : null}

        {/* Review Header & Metadata */}
        <div className="reviews-section-card">
          <div className="reviews-section-card-head">
            <div className="flex flex-wrap items-center gap-2.5">
              <ReviewStars rating={review.rating} size={16} showNumeric />
              <StatusBadge value={review.status} />
              {review.verified_purchase ? (
                <span className="reviews-pill reviews-pill-brand">
                  <Icon name="check" size={11} />
                  Verified purchase
                </span>
              ) : null}
              {review.deleted_at ? (
                <span className="reviews-pill reviews-pill-danger">
                  Deleted by customer
                </span>
              ) : null}
            </div>
            <span className="text-xs text-slate-500">
              Submitted {formatReviewTimestamp(review.submitted_at ?? review.created_at)}
            </span>
          </div>

          <div className="catalog-detail-meta">
            <div className="catalog-detail-row">
              <span className="catalog-detail-label">Customer</span>
              <span className="catalog-detail-value">
                {review.author
                  ? `${review.author.name} (${review.author.email})`
                  : `User #${review.user_id}`}
              </span>
            </div>
            <div className="catalog-detail-row">
              <span className="catalog-detail-label">Product</span>
              <span className="catalog-detail-value">
                {review.product
                  ? `${review.product.name} (#${review.product.id})`
                  : `Product #${review.product_id}`}
              </span>
            </div>
            {review.published_at ? (
              <div className="catalog-detail-row">
                <span className="catalog-detail-label">Published at</span>
                <span className="catalog-detail-value">
                  {formatReviewTimestamp(review.published_at)}
                </span>
              </div>
            ) : null}
            {review.moderated_at ? (
              <div className="catalog-detail-row">
                <span className="catalog-detail-label">Last moderated</span>
                <span className="catalog-detail-value">
                  {formatReviewTimestamp(review.moderated_at)}
                  {review.moderator ? ` by ${review.moderator.name}` : ""}
                </span>
              </div>
            ) : null}
            {review.moderation_reason ? (
              <div className="catalog-detail-row">
                <span className="catalog-detail-label">Moderation reason</span>
                <span className="catalog-detail-value">
                  {review.moderation_reason}
                </span>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-100 pt-3">
            {review.title ? (
              <h4 className="text-base font-bold text-slate-900">
                {review.title}
              </h4>
            ) : null}
            {review.body ? (
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {review.body}
              </p>
            ) : (
              <p className="mt-1.5 text-xs italic text-slate-500">
                Customer submitted a rating without written commentary.
              </p>
            )}
          </div>
        </div>

        {/* Private/Public Media Preview */}
        <ReviewMediaPreview
          media={review.media}
          reviewStatus={review.status}
          isRefreshing={detailQuery.isFetching}
          onRefreshUrls={() => void detailQuery.refetch()}
        />

        {/* Moderation Actions */}
        <ReviewModerationPanel
          key={`moderate-${review.id}-v${review.lock_version}`}
          review={review}
          canModerate={canModerate}
          onReloadLatest={() => void detailQuery.refetch()}
          onModerated={(_, message) => {
            handleLocalNotice(message);
          }}
        />

        {/* Official Storefront Reply */}
        <ReviewReplyPanel
          key={`reply-${review.id}-${review.reply?.updated_at ?? review.reply?.id ?? "none"}`}
          review={review}
          canModerate={canModerate}
          onChanged={(message) => {
            handleLocalNotice(message);
          }}
        />

        <div className="catalog-detail-footer">
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}

