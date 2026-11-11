"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import {
  ActionButton,
  DismissibleNotice,
  Field,
} from "@/components/ui/admin-primitives";
import { Icon } from "@/components/ui/icon";
import { moderateAdminReview } from "../api";
import {
  MODERATION_REASON_MAX_LENGTH,
  moderateReviewFormSchema,
  type AdminReview,
  type ReviewModerationTarget,
} from "../contracts";
import {
  extractReviewFieldError,
  isReviewConflictError,
  reviewErrorMessage,
} from "../errors";
import { invalidateAdminReviews } from "../queries";
import { MODERATION_REASON_PRESETS } from "../utils";

export interface ReviewModerationPanelProps {
  review: AdminReview;
  canModerate: boolean;
  onModerated: (updated: AdminReview, message: string) => void;
  onReloadLatest: () => void;
}

const TARGET_ACTIONS: readonly {
  target: ReviewModerationTarget;
  label: string;
  icon: "check" | "cancel" | "eye-off";
}[] = [
  { target: "approved", label: "Approve review", icon: "check" },
  { target: "rejected", label: "Reject review", icon: "cancel" },
  { target: "hidden", label: "Hide from storefront", icon: "eye-off" },
];

function defaultTargetForStatus(status: AdminReview["status"]): ReviewModerationTarget {
  if (status === "approved") return "hidden";
  return "approved";
}

export function ReviewModerationPanel({
  review,
  canModerate,
  onModerated,
  onReloadLatest,
}: ReviewModerationPanelProps) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [targetStatus, setTargetStatus] = useState<ReviewModerationTarget>(
    () => defaultTargetForStatus(review.status),
  );
  const [reason, setReason] = useState<string>(review.moderation_reason ?? "");
  const [validationError, setValidationError] = useState<string>("");

  const isDeleted = review.deleted_at !== null;

  const mutation = useMutation({
    mutationFn: (payload: { status: ReviewModerationTarget; reason: string }) =>
      moderateAdminReview(review.id, {
        status: payload.status,
        reason: payload.reason,
        lock_version: review.lock_version,
      }),
    onSuccess: async (updated) => {
      await invalidateAdminReviews(queryClient, review.id);
      const label =
        updated.status === "approved"
          ? "approved and published"
          : updated.status === "rejected"
            ? "rejected"
            : "hidden from the storefront";
      onModerated(updated, `Review #${updated.id} has been ${label}.`);
    },
  });

  if (isDeleted) {
    return (
      <section className="reviews-section-card" aria-label="Moderation decision">
        <div className="reviews-section-card-head">
          <h3>Moderation decision</h3>
        </div>
        <DismissibleNotice
          variant="warning"
          durationMs={0}
          message="This review was deleted by the customer and cannot be moderated."
        />
      </section>
    );
  }

  if (!canModerate) {
    return (
      <section className="reviews-section-card" aria-label="Moderation decision">
        <div className="reviews-section-card-head">
          <h3>Moderation decision</h3>
        </div>
        <p className="text-xs text-slate-500">
          Your role provides read-only review inspection.
        </p>
      </section>
    );
  }

  const conflictDetected =
    mutation.isError && isReviewConflictError(mutation.error);
  const serverFieldError = mutation.isError
    ? extractReviewFieldError(mutation.error, "reason")
    : undefined;
  const presets = MODERATION_REASON_PRESETS[targetStatus];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setValidationError("");
    mutation.reset();

    if (targetStatus === review.status) {
      setValidationError(
        `Select an action other than the current "${review.status}" state.`,
      );
      return;
    }

    const parsed = moderateReviewFormSchema.safeParse({
      status: targetStatus,
      reason,
    });

    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ??
          "Please provide a valid moderation reason.",
      );
      return;
    }

    mutation.mutate({
      status: parsed.data.status,
      reason: parsed.data.reason,
    });
  }

  return (
    <section className="reviews-section-card" aria-label="Moderation decision">
      <div className="reviews-section-card-head">
        <h3>Moderation decision</h3>
        <span className="reviews-pill">Version v{review.lock_version}</span>
      </div>

      {mutation.isError ? (
        <div className="space-y-2">
          <DismissibleNotice
            variant="error"
            durationMs={conflictDetected ? 0 : 4000}
            message={reviewErrorMessage(mutation.error)}
            onDismiss={() => mutation.reset()}
          />
          {conflictDetected ? (
            <div className="flex justify-end">
              <ActionButton
                variant="secondary"
                onClick={() => {
                  mutation.reset();
                  onReloadLatest();
                }}
              >
                <Icon name="refresh" size={14} />
                Reload latest review
              </ActionButton>
            </div>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div
          className="reviews-action-grid"
          role="group"
          aria-label="Choose moderation outcome"
        >
          {TARGET_ACTIONS.map((item) => {
            const isCurrentStatus = review.status === item.target;
            const isSelected = targetStatus === item.target && !isCurrentStatus;

            return (
              <button
                key={item.target}
                type="button"
                disabled={isCurrentStatus || mutation.isPending}
                aria-pressed={isSelected}
                onClick={() => {
                  setTargetStatus(item.target);
                  setValidationError("");
                }}
                className={`reviews-target-btn ${
                  isSelected ? `reviews-target-${item.target}` : ""
                }`}
              >
                <Icon name={item.icon} size={15} />
                <span>{isCurrentStatus ? `Current: ${item.target}` : item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Quick reason presets
          </span>
          <div className="reviews-preset-list">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={mutation.isPending}
                onClick={() => {
                  setReason(preset);
                  setValidationError("");
                }}
                className="reviews-preset-chip"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Moderation reason"
          htmlFor={reasonId}
          required
          hint={`${reason.length}/${MODERATION_REASON_MAX_LENGTH} characters (recorded in audit log)`}
          error={validationError || serverFieldError}
        >
          <textarea
            id={reasonId}
            rows={3}
            maxLength={MODERATION_REASON_MAX_LENGTH}
            disabled={mutation.isPending}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (validationError) setValidationError("");
            }}
            placeholder="Explain why this review is being approved, rejected, or hidden…"
            className="catalog-input catalog-textarea"
          />
        </Field>

        <div className="flex justify-end">
          <ActionButton
            type="submit"
            variant={targetStatus === "rejected" ? "danger" : "primary"}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Applying decision…"
              : targetStatus === "approved"
                ? "Confirm approval"
                : targetStatus === "rejected"
                  ? "Confirm rejection"
                  : "Confirm hide"}
          </ActionButton>
        </div>
      </form>
    </section>
  );
}

