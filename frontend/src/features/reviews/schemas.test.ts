import { describe, expect, it } from "vitest";

import {
  REVIEW_BODY_MAX_LENGTH,
  REVIEW_IMAGE_MAX_BYTES,
  REVIEW_IMAGE_MAX_COUNT,
  REVIEW_VIDEO_MAX_BYTES,
  REVIEW_VIDEO_MAX_COUNT,
  REVIEW_VIDEO_MAX_DURATION_SECONDS,
} from "./constants";
import { reviewFormSchema, validateMediaFileCandidate } from "./schemas";

function makeFile(
  name: string,
  size: number,
  type: string,
): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("reviewFormSchema", () => {
  it("accepts valid 1–5 rating with required review body", () => {
    expect(
      reviewFormSchema.safeParse({
        rating: 5,
        body: "Absorbs fast and feels non-greasy.",
      }).success,
    ).toBe(true);
  });

  it("rejects empty or whitespace-only review body even with a valid rating", () => {
    const emptyResult = reviewFormSchema.safeParse({
      rating: 5,
      body: "",
    });
    expect(emptyResult.success).toBe(false);

    const whitespaceResult = reviewFormSchema.safeParse({
      rating: 4,
      body: "   \n  ",
    });
    expect(whitespaceResult.success).toBe(false);
  });

  it("rejects out-of-range ratings and oversized body text", () => {
    expect(
      reviewFormSchema.safeParse({
        rating: 0,
        body: "Valid text",
      }).success,
    ).toBe(false);

    expect(
      reviewFormSchema.safeParse({
        rating: 6,
        body: "Valid text",
      }).success,
    ).toBe(false);

    expect(
      reviewFormSchema.safeParse({
        rating: 5,
        body: "b".repeat(REVIEW_BODY_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});

describe("validateMediaFileCandidate", () => {
  it("accepts allowed image types within size and count limits", () => {
    const webp = makeFile("photo.webp", REVIEW_IMAGE_MAX_BYTES, "image/webp");
    const result = validateMediaFileCandidate({
      file: webp,
      existingImageCount: 4,
      existingVideoCount: 0,
      videoEnabled: false,
    });

    expect(result).toEqual({
      ok: true,
      kind: "image",
      format: "webp",
      mimeType: "image/webp",
    });
  });

  it("enforces max 5 images, max 5 MB, and blocks mismatched MIME/unsupported formats", () => {
    const oversized = makeFile(
      "big.png",
      REVIEW_IMAGE_MAX_BYTES + 1,
      "image/png",
    );
    expect(
      validateMediaFileCandidate({
        file: oversized,
        existingImageCount: 0,
        existingVideoCount: 0,
        videoEnabled: false,
      }),
    ).toMatchObject({ ok: false });

    const sixthPhoto = makeFile("six.jpg", 1024, "image/jpeg");
    expect(
      validateMediaFileCandidate({
        file: sixthPhoto,
        existingImageCount: REVIEW_IMAGE_MAX_COUNT,
        existingVideoCount: 0,
        videoEnabled: false,
      }),
    ).toMatchObject({ ok: false });

    const spoofed = makeFile("fake.jpg", 1024, "image/gif");
    expect(
      validateMediaFileCandidate({
        file: spoofed,
        existingImageCount: 0,
        existingVideoCount: 0,
        videoEnabled: false,
      }),
    ).toMatchObject({ ok: false });
  });

  it("blocks video when disabled and enforces 1 video / 30 MB / 30s limits when enabled", () => {
    const mp4 = makeFile("clip.mp4", 1_000_000, "video/mp4");

    expect(
      validateMediaFileCandidate({
        file: mp4,
        existingImageCount: 0,
        existingVideoCount: 0,
        videoEnabled: false,
        durationSeconds: 10,
      }),
    ).toEqual({ ok: false, error: "Video uploads are currently disabled." });

    expect(
      validateMediaFileCandidate({
        file: mp4,
        existingImageCount: 0,
        existingVideoCount: 0,
        videoEnabled: true,
        durationSeconds: REVIEW_VIDEO_MAX_DURATION_SECONDS,
      }),
    ).toEqual({
      ok: true,
      kind: "video",
      format: "mp4",
      mimeType: "video/mp4",
    });

    expect(
      validateMediaFileCandidate({
        file: mp4,
        existingImageCount: 0,
        existingVideoCount: REVIEW_VIDEO_MAX_COUNT,
        videoEnabled: true,
        durationSeconds: 10,
      }),
    ).toMatchObject({ ok: false });

    expect(
      validateMediaFileCandidate({
        file: makeFile("too-long.webm", 1_000_000, "video/webm"),
        existingImageCount: 0,
        existingVideoCount: 0,
        videoEnabled: true,
        durationSeconds: REVIEW_VIDEO_MAX_DURATION_SECONDS + 1,
      }),
    ).toMatchObject({ ok: false });

    expect(
      validateMediaFileCandidate({
        file: makeFile("too-heavy.mp4", REVIEW_VIDEO_MAX_BYTES + 1, "video/mp4"),
        existingImageCount: 0,
        existingVideoCount: 0,
        videoEnabled: true,
        durationSeconds: 10,
      }),
    ).toMatchObject({ ok: false });
  });
});
