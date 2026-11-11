"use client";

import {
  Expand,
  Film,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

import type { ReviewMediaItem } from "../types";
import { formatFileSize, isMediaUrlExpiringSoon } from "../utils";

export interface SignedMediaImageProps {
  src: string;
  alt: string;
  className?: string | undefined;
  onError?: (() => void) | undefined;
}

/**
 * Renders local blob previews and short-lived private signed download URLs directly,
 * bypassing Next.js static Image optimization so authenticated tokens and blobs load cleanly.
 */
export function SignedMediaImage({
  src,
  alt,
  className,
  onError,
}: SignedMediaImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Renders blob previews and short-lived signed delivery URLs
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={onError}
      className={className}
    />
  );
}

export interface ReviewMediaGalleryProps {
  media: ReviewMediaItem[];
  reviewerLabel?: string | undefined;
  onRefreshUrl?: ((mediaId: number) => Promise<ReviewMediaItem | null>) | undefined;
  onRemoveMedia?: ((mediaId: number) => void) | undefined;
  removingMediaId?: number | null | undefined;
  disableRemove?: boolean | undefined;
}

export function ReviewMediaGallery({
  media,
  reviewerLabel = "customer",
  onRefreshUrl,
  onRemoveMedia,
  removingMediaId = null,
  disableRemove = false,
}: ReviewMediaGalleryProps) {
  const [urlOverrides, setUrlOverrides] = useState<
    Record<number, { url: string; expiresAt: string }>
  >({});
  const [refreshingIds, setRefreshingIds] = useState<Record<number, boolean>>(
    {},
  );
  const [brokenIds, setBrokenIds] = useState<Record<number, boolean>>({});
  const autoRefreshedIdsRef = useRef<Set<number>>(new Set());
  const [activeMediaId, setActiveMediaId] = useState<number | null>(null);

  useEffect(() => {
    if (!onRefreshUrl) return;

    media.forEach((item) => {
      const effectiveExpiresAt =
        urlOverrides[item.id]?.expiresAt ?? item.url_expires_at;

      if (
        isMediaUrlExpiringSoon(effectiveExpiresAt) &&
        !autoRefreshedIdsRef.current.has(item.id)
      ) {
        autoRefreshedIdsRef.current.add(item.id);
        void handleRefresh(item.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally keyed off media list updates
  }, [media, onRefreshUrl]);

  if (media.length === 0) {
    return null;
  }

  async function handleRefresh(mediaId: number) {
    if (!onRefreshUrl) return;

    setRefreshingIds((prev) => ({ ...prev, [mediaId]: true }));
    try {
      const refreshed = await onRefreshUrl(mediaId);
      if (refreshed) {
        setUrlOverrides((prev) => ({
          ...prev,
          [mediaId]: {
            url: refreshed.url,
            expiresAt: refreshed.url_expires_at,
          },
        }));
        setBrokenIds((prev) => {
          const next = { ...prev };
          delete next[mediaId];
          return next;
        });
      }
    } catch {
      setBrokenIds((prev) => ({ ...prev, [mediaId]: true }));
    } finally {
      setRefreshingIds((prev) => ({ ...prev, [mediaId]: false }));
    }
  }

  function resolveUrl(item: ReviewMediaItem): string {
    return urlOverrides[item.id]?.url ?? item.url;
  }

  const activeItem =
    activeMediaId !== null
      ? (media.find((item) => item.id === activeMediaId) ?? null)
      : null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {media.map((item, index) => {
          const src = resolveUrl(item);
          const isRefreshing = Boolean(refreshingIds[item.id]);
          const isBroken = Boolean(brokenIds[item.id]);
          const isRemoving = removingMediaId === item.id;

          return (
            <div
              key={item.id}
              className="border-line bg-surface-subtle group relative size-22 overflow-hidden rounded-2xl border shadow-xs sm:size-24"
            >
              <button
                type="button"
                onClick={() => setActiveMediaId(item.id)}
                aria-label={`Open ${item.kind} ${index + 1} uploaded by ${reviewerLabel}`}
                className="focus-visible:ring-brand-500 relative block size-full cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
              >
                {item.kind === "video" ? (
                  <div className="bg-brand-50 text-brand-700 flex size-full flex-col items-center justify-center gap-1 p-2">
                    <Film className="size-6" aria-hidden="true" />
                    <span className="text-[11px] font-semibold">
                      Video
                      {item.duration_seconds
                        ? ` · ${Math.round(item.duration_seconds)}s`
                        : ""}
                    </span>
                  </div>
                ) : isBroken ? (
                  <div className="text-ink-muted flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-[11px]">
                    <span>Preview expired</span>
                  </div>
                ) : (
                  <SignedMediaImage
                    src={src}
                    alt={`Review photo ${index + 1} from ${reviewerLabel}`}
                    onError={() => {
                      if (
                        onRefreshUrl &&
                        !autoRefreshedIdsRef.current.has(item.id)
                      ) {
                        autoRefreshedIdsRef.current.add(item.id);
                        void handleRefresh(item.id);
                      } else {
                        setBrokenIds((prev) => ({ ...prev, [item.id]: true }));
                      }
                    }}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                <span
                  aria-hidden="true"
                  className="bg-ink/60 pointer-events-none absolute right-1.5 bottom-1.5 rounded-full p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Expand className="size-3" />
                </span>
              </button>

              {onRefreshUrl && isBroken ? (
                <button
                  type="button"
                  onClick={() => void handleRefresh(item.id)}
                  disabled={isRefreshing}
                  aria-label="Refresh signed media link"
                  className="bg-surface-elevated/95 text-brand-700 hover:bg-brand-50 absolute inset-x-1 bottom-1 inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold shadow-xs"
                >
                  <RefreshCw
                    className={cn(
                      "size-3",
                      isRefreshing && "animate-spin",
                    )}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              ) : null}

              {onRemoveMedia ? (
                <button
                  type="button"
                  disabled={isRemoving || disableRemove}
                  onClick={() => onRemoveMedia(item.id)}
                  aria-label={`Remove attached ${item.kind} ${index + 1}`}
                  className="bg-danger-600 hover:bg-danger-700 focus-visible:ring-danger-600 absolute top-1.5 right-1.5 grid size-6 cursor-pointer place-items-center rounded-full text-white shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRemoving ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-3" aria-hidden="true" />
                  )}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Accessible Lightbox Modal */}
      <Modal
        open={activeItem !== null}
        onOpenChange={(open) => {
          if (!open) setActiveMediaId(null);
        }}
        title={
          activeItem
            ? `${activeItem.kind === "video" ? "Review Video" : "Review Photo"} · ${formatFileSize(activeItem.bytes)}`
            : "Review Media"
        }
        size="lg"
      >
        {activeItem ? (
          <div className="space-y-4">
            <div className="bg-surface-subtle border-line flex max-h-[65dvh] items-center justify-center overflow-hidden rounded-2xl border p-2">
              {activeItem.kind === "video" ? (
                <video
                  src={resolveUrl(activeItem)}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[60dvh] w-full rounded-xl"
                />
              ) : (
                <SignedMediaImage
                  src={resolveUrl(activeItem)}
                  alt={`Enlarged review photo from ${reviewerLabel}`}
                  className="max-h-[60dvh] w-auto rounded-xl object-contain"
                />
              )}
            </div>

            {onRefreshUrl ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-muted text-xs">
                  Protected review media uses temporary signed links.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={Boolean(refreshingIds[activeItem.id])}
                  leftIcon={<RefreshCw className="size-3.5" aria-hidden="true" />}
                  onClick={() => void handleRefresh(activeItem.id)}
                >
                  Refresh link
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
