import { describe, expect, it } from "vitest";
import { buildAdminReviewsQueryString } from "./api";
import {
  MODERATION_REASON_MAX_LENGTH,
  REPLY_BODY_MAX_LENGTH,
  moderateReviewFormSchema,
  paginatedAdminReviewsSchema,
  reviewReplyFormSchema,
} from "./contracts";

describe("admin review contracts and query builder", () => {
  it("parses paginated admin reviews response matching backend resource shape", () => {
    const parsed = paginatedAdminReviewsSchema.safeParse({
      data: [
        {
          id: 12,
          product_id: 5,
          user_id: 8,
          vendor_id: 2,
          rating: 5,
          title: "Super hydrating",
          body: "Works smoothly.",
          status: "pending",
          verified_purchase: true,
          moderation_reason: null,
          lock_version: 1,
          submitted_at: "2026-11-11T10:00:00.000Z",
          published_at: null,
          moderated_at: null,
          deleted_at: null,
          created_at: "2026-11-11T10:00:00.000Z",
          updated_at: "2026-11-11T10:00:00.000Z",
          product: {
            id: 5,
            vendor_id: 2,
            name: "Rose Hydrating Mist",
            slug: "rose-hydrating-mist",
          },
          author: {
            id: 8,
            name: "Tasnim Akter",
            email: "tasnim@example.com",
          },
          moderator: null,
          media: [
            {
              id: 30,
              review_id: 12,
              kind: "image",
              format: "webp",
              mime_type: "image/webp",
              bytes: 120000,
              width: 800,
              height: 800,
              duration_seconds: null,
              sort_order: 0,
              status: "ready",
              url: "https://api.cloudinary.com/v1_1/demo/image/download?token=abc",
              url_expires_at: "2099-01-01T00:00:00.000Z",
              created_at: "2026-11-11T10:01:00.000Z",
            },
          ],
          reply: null,
          audit_logs: [
            {
              id: 90,
              action: "review.submitted",
              actor: { id: 8, name: "Tasnim Akter" },
              before: null,
              after: { status: "pending", rating: 5 },
              ip_address: "127.0.0.1",
              created_at: "2026-11-11T10:00:00.000Z",
            },
          ],
        },
      ],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 1,
        total: 1,
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("enforces required moderation reason bounds", () => {
    expect(
      moderateReviewFormSchema.safeParse({
        status: "approved",
        reason: "ok",
      }).success,
    ).toBe(false);

    expect(
      moderateReviewFormSchema.safeParse({
        status: "rejected",
        reason: "x".repeat(MODERATION_REASON_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);

    expect(
      moderateReviewFormSchema.safeParse({
        status: "hidden",
        reason: "Policy violation confirmed during audit.",
      }).success,
    ).toBe(true);
  });

  it("enforces official reply length limits", () => {
    expect(reviewReplyFormSchema.safeParse({ body: " " }).success).toBe(false);
    expect(
      reviewReplyFormSchema.safeParse({
        body: "a".repeat(REPLY_BODY_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      reviewReplyFormSchema.safeParse({
        body: "Thank you for your feedback!",
      }).success,
    ).toBe(true);
  });

  it("serializes all admin review filter params consistently", () => {
    expect(
      buildAdminReviewsQueryString({
        page: 2,
        perPage: 10,
        search: "hydrating",
        status: "pending",
        rating: 5,
        productId: 42,
        withMedia: true,
        dateFrom: "2026-11-01",
        dateTo: "2026-11-11",
        trash: "with",
        sort: "highest",
      }),
    ).toBe(
      "?page=2&per_page=10&search=hydrating&status=pending&rating=5&product_id=42&with_media=1&date_from=2026-11-01&date_to=2026-11-11&trash=with&sort=highest",
    );
  });
});

