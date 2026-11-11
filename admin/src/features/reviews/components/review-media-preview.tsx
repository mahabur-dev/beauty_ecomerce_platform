"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/admin-primitives";
import { Icon } from "@/components/ui/icon";
import type { ReviewMediaItem, ReviewStatus } from "../contracts";
import { formatMediaBytes } from "../utils";

function SignedAdminMediaImage({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  onError?: (() => void) | undefined;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Private expiring signed Cloudinary URLs bypass Next Image optimizer
    <img src={src} alt={alt} loading="lazy" decoding="async" onError={onError} />
  );
}

export interface ReviewMediaPreviewProps {
  media: ReviewMediaItem[];
  reviewStatus: ReviewStatus;
  isRefreshing: boolean;
  onRefreshUrls: () => void;
}

export function ReviewMediaPreview({
  media,
  reviewStatus,
  isRefreshing,
  onRefreshUrls,
}: ReviewMediaPreviewProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    media[0]?.id ?? null,
  );
  const [brokenIds, setBrokenIds] = useState<Record<number, boolean>>({});

  if (media.length === 0) {
    return null;
  }

  const activeItem =
    media.find((item) => item.id === selectedId) ?? media[0] ?? null;

  return (
    <section
      className="reviews-section-card"
      aria-label="Submitted review media"
    >
      <div className="reviews-section-card-head">
        <div className="flex flex-wrap items-center gap-2">
          <h3>Attached media ({media.length})</h3>
          {reviewStatus !== "approved" ? (
            <span className="reviews-pill reviews-pill-brand">
              <Icon name="lock" size={11} />
              Private moderation preview
            </span>
          ) : null}
        </div>

        <ActionButton
          variant="ghost"
          disabled={isRefreshing}
          onClick={() => {
            setBrokenIds({});
            onRefreshUrls();
          }}
        >
          <Icon name="refresh" size={14} />
          {isRefreshing ? "Refreshing…" : "Refresh signed links"}
        </ActionButton>
      </div>

      <div className="reviews-media-grid">
        {media.map((item, idx) => {
          const isSelected = activeItem?.id === item.id;
          const isBroken = Boolean(brokenIds[item.id]);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              aria-label={`Preview ${item.kind} attachment ${idx + 1}`}
              aria-pressed={isSelected}
              className={`reviews-media-thumb ${
                isSelected ? "reviews-media-thumb-active" : ""
              }`}
            >
              {item.kind === "video" ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-600">
                  <Icon name="film" size={20} />
                  <span className="text-[10px] font-semibold">
                    {item.duration_seconds
                      ? `${Math.round(item.duration_seconds)}s video`
                      : "Video"}
                  </span>
                </span>
              ) : isBroken ? (
                <span className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-slate-500">
                  Link expired
                </span>
              ) : (
                <SignedAdminMediaImage
                  src={item.url}
                  alt={`Customer attachment ${idx + 1}`}
                  onError={() =>
                    setBrokenIds((prev) => ({ ...prev, [item.id]: true }))
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div className="reviews-media-lightbox">
          {activeItem.kind === "video" ? (
            <video
              key={activeItem.url}
              src={activeItem.url}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <SignedAdminMediaImage
              key={activeItem.url}
              src={activeItem.url}
              alt="Expanded review media preview"
              onError={() =>
                setBrokenIds((prev) => ({ ...prev, [activeItem.id]: true }))
              }
            />
          )}
          <div className="flex w-full flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {activeItem.kind.toUpperCase()} · {activeItem.format.toUpperCase()}{" "}
              · {formatMediaBytes(activeItem.bytes)}
              {activeItem.width && activeItem.height
                ? ` · ${activeItem.width}×${activeItem.height}`
                : ""}
              {activeItem.duration_seconds
                ? ` · ${Math.round(activeItem.duration_seconds)}s`
                : ""}
            </span>
            <span>Status: {activeItem.status}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

