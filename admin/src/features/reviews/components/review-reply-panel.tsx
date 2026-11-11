"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import {
  ActionButton,
  DismissibleNotice,
  Field,
} from "@/components/ui/admin-primitives";
import { Icon } from "@/components/ui/icon";
import {
  createAdminReviewReply,
  deleteAdminReviewReply,
  updateAdminReviewReply,
} from "../api";
import {
  REPLY_BODY_MAX_LENGTH,
  reviewReplyFormSchema,
  type AdminReview,
} from "../contracts";
import { extractReviewFieldError, reviewErrorMessage } from "../errors";
import { invalidateAdminReviews } from "../queries";
import { formatReviewTimestamp } from "../utils";

export interface ReviewReplyPanelProps {
  review: AdminReview;
  canModerate: boolean;
  onChanged: (message: string) => void;
}

export function ReviewReplyPanel({
  review,
  canModerate,
  onChanged,
}: ReviewReplyPanelProps) {
  const queryClient = useQueryClient();
  const replyFieldId = useId();
  const existingReply = review.reply ?? null;

  const [isEditing, setIsEditing] = useState(existingReply === null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [body, setBody] = useState(existingReply?.body ?? "");
  const [validationError, setValidationError] = useState("");

  const isDeleted = review.deleted_at !== null;

  const saveMutation = useMutation({
    mutationFn: (cleanBody: string) =>
      existingReply
        ? updateAdminReviewReply(review.id, cleanBody)
        : createAdminReviewReply(review.id, cleanBody),
    onSuccess: async () => {
      await invalidateAdminReviews(queryClient, review.id);
      setIsEditing(false);
      onChanged(
        existingReply
          ? "Official storefront reply updated."
          : "Official storefront reply published.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminReviewReply(review.id),
    onSuccess: async () => {
      await invalidateAdminReviews(queryClient, review.id);
      setBody("");
      setConfirmingDelete(false);
      setIsEditing(true);
      onChanged("Official storefront reply deleted.");
    },
  });

  if (isDeleted) {
    return null;
  }

  const activeError = saveMutation.error ?? deleteMutation.error;
  const serverFieldError = saveMutation.isError
    ? extractReviewFieldError(saveMutation.error, "body")
    : undefined;

  function handleSave(event: FormEvent) {
    event.preventDefault();
    setValidationError("");
    saveMutation.reset();

    const parsed = reviewReplyFormSchema.safeParse({ body });
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? "Please enter a valid reply.",
      );
      return;
    }

    saveMutation.mutate(parsed.data.body);
  }

  return (
    <section
      className="reviews-section-card"
      aria-label="Official storefront reply"
    >
      <div className="reviews-section-card-head">
        <div className="flex items-center gap-2">
          <Icon name="message" size={16} />
          <h3>Official GlowCare response</h3>
        </div>

        {existingReply && canModerate && !isEditing ? (
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => {
                setBody(existingReply.body);
                setValidationError("");
                setConfirmingDelete(false);
                setIsEditing(true);
              }}
            >
              Edit reply
            </ActionButton>
            {!confirmingDelete ? (
              <ActionButton
                variant="danger"
                onClick={() => setConfirmingDelete(true)}
              >
                <Icon name="trash" size={14} />
                Delete reply
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {review.status !== "approved" ? (
        <p className="text-xs text-slate-500">
          Note: Official replies become publicly visible on the storefront only
          when this review has Approved status.
        </p>
      ) : null}

      {activeError ? (
        <DismissibleNotice
          variant="error"
          durationMs={4000}
          message={reviewErrorMessage(activeError)}
          onDismiss={() => {
            saveMutation.reset();
            deleteMutation.reset();
          }}
        />
      ) : null}

      {confirmingDelete && existingReply ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
          <p className="font-semibold">
            Remove this official reply permanently?
          </p>
          <div className="mt-2.5 flex flex-wrap justify-end gap-2">
            <ActionButton
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </ActionButton>
            <ActionButton
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Removing…" : "Confirm delete reply"}
            </ActionButton>
          </div>
        </div>
      ) : null}

      {existingReply && !isEditing ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <strong className="text-slate-800">{existingReply.author_name}</strong>
            <span>
              {formatReviewTimestamp(
                existingReply.updated_at ?? existingReply.created_at,
              )}
            </span>
          </div>
          <p className="mt-2 leading-relaxed whitespace-pre-line text-slate-700">
            {existingReply.body}
          </p>
        </div>
      ) : canModerate ? (
        <form onSubmit={handleSave} noValidate className="space-y-3">
          <Field
            label={existingReply ? "Update official reply" : "Write official reply"}
            htmlFor={replyFieldId}
            required
            hint={`${body.length}/${REPLY_BODY_MAX_LENGTH} characters`}
            error={validationError || serverFieldError}
          >
            <textarea
              id={replyFieldId}
              rows={3}
              maxLength={REPLY_BODY_MAX_LENGTH}
              disabled={saveMutation.isPending}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="Write a helpful, brand-appropriate official response for customers…"
              className="catalog-input catalog-textarea"
            />
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            {existingReply ? (
              <ActionButton
                variant="secondary"
                disabled={saveMutation.isPending}
                onClick={() => {
                  setIsEditing(false);
                  setValidationError("");
                }}
              >
                Cancel
              </ActionButton>
            ) : null}
            <ActionButton type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving reply…"
                : existingReply
                  ? "Save updated reply"
                  : "Publish reply"}
            </ActionButton>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-500">No official reply posted yet.</p>
      )}
    </section>
  );
}

