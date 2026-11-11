import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentAdminQuery } from "@/features/auth/query-options";
import type { AdminUser } from "@/features/auth/types";
import { ApiError } from "@/lib/api/errors";
import * as reviewsApi from "./api";
import { ReviewsPage } from "./components/reviews-page";
import type { AdminReview } from "./contracts";

const superAdminUser: AdminUser = {
  id: 1,
  name: "Super Moderator",
  email: "admin@glowcare.test",
  email_verified: true,
  is_active: true,
  vendor_id: null,
  roles: ["super_admin"],
  mfa_enabled: true,
};

const samplePendingReview: AdminReview = {
  id: 44,
  product_id: 7,
  user_id: 19,
  vendor_id: 2,
  rating: 4,
  title: "Soothing texture",
  body: "Works nicely for dry skin.",
  status: "pending",
  verified_purchase: true,
  moderation_reason: null,
  lock_version: 2,
  submitted_at: "2026-11-10T10:30:00.000Z",
  published_at: null,
  moderated_at: null,
  deleted_at: null,
  created_at: "2026-11-10T10:30:00.000Z",
  updated_at: "2026-11-10T10:30:00.000Z",
  product: {
    id: 7,
    vendor_id: 2,
    name: "Deep Hydration Lotion",
    slug: "deep-hydration-lotion",
  },
  author: {
    id: 19,
    name: "Farhana Islam",
    email: "farhana@example.com",
  },
  moderator: null,
  media: [
    {
      id: 901,
      review_id: 44,
      kind: "image",
      format: "webp",
      mime_type: "image/webp",
      bytes: 185000,
      width: 900,
      height: 900,
      duration_seconds: null,
      sort_order: 0,
      status: "ready",
      url: "https://api.cloudinary.com/v1_1/demo/image/download?token=pend-901",
      url_expires_at: "2099-01-01T00:00:00.000Z",
      created_at: "2026-11-10T10:32:00.000Z",
    },
  ],
  reply: null,
  audit_logs: [
    {
      id: 301,
      action: "review.submitted",
      actor: { id: 19, name: "Farhana Islam" },
      before: null,
      after: { status: "pending", rating: 4 },
      ip_address: "10.0.0.5",
      created_at: "2026-11-10T10:30:00.000Z",
    },
  ],
};

function renderWithAdmin(ui: ReactNode, user: AdminUser | null = superAdminUser) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  if (user) {
    client.setQueryData(currentAdminQuery.queryKey, user);
  }

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("Admin ReviewsPage & Moderation Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reviewsApi, "listReviewProductOptions").mockResolvedValue([
      { id: 7, name: "Deep Hydration Lotion", slug: "deep-hydration-lotion" },
    ]);
    vi.spyOn(reviewsApi, "listAdminReviews").mockResolvedValue({
      data: [samplePendingReview],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        per_page: 10,
        to: 1,
        total: 12,
      },
    });
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue(
      samplePendingReview,
    );
  });

  it("denies access when authenticated user lacks reviews.read permission", () => {
    renderWithAdmin(<ReviewsPage />, {
      ...superAdminUser,
      roles: ["customer"],
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Access denied");
  });

  it("applies server filters, validates date ordering, and paginates", async () => {
    const listSpy = vi.spyOn(reviewsApi, "listAdminReviews");

    renderWithAdmin(<ReviewsPage />);

    expect(await screen.findByText("Soothing texture")).toBeInTheDocument();
    expect(screen.getByText("12 reviews")).toBeInTheDocument();
    expect(screen.getByText("Total reviews")).toBeInTheDocument();
    expect(screen.getByText("Pending reviews")).toBeInTheDocument();
    expect(screen.getByText("Total medias")).toBeInTheDocument();
    expect(screen.getByText("Total approved reviews")).toBeInTheDocument();

    // Filter by status: Pending
    fireEvent.click(
      screen.getByRole("button", { name: /Filter review status/i }),
    );
    fireEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: "Pending",
      }),
    );
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending", page: 1 }),
      );
    });

    // Toggle "With media only"
    fireEvent.click(screen.getByRole("button", { name: /With media only/i }));
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ withMedia: true, page: 1 }),
      );
    });

    // Select Rating: 5 stars
    fireEvent.click(screen.getByRole("button", { name: /Filter by rating/i }));
    fireEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", {
        name: "5 stars",
      }),
    );
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 5, page: 1 }),
      );
    });

    // Invalid date range shows warning cleanly
    fireEvent.change(screen.getByLabelText("Submitted from date"), {
      target: { value: "2026-11-11" },
    });
    fireEvent.change(screen.getByLabelText("Submitted to date"), {
      target: { value: "2026-11-05" },
    });
    expect(
      screen.getByText(
        "The submitted end date cannot be earlier than the start date.",
      ),
    ).toBeInTheDocument();

    // Next page
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("opens review detail with private pending media, enforces reason, handles 409 conflict & moderates", async () => {
    renderWithAdmin(<ReviewsPage />);

    const inspectBtn = await screen.findByRole("button", {
      name: "Inspect review #44",
    });
    fireEvent.click(inspectBtn);

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Private moderation preview"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Audit timeline/i),
    ).not.toBeInTheDocument();

    // Validation requires >= 3 characters reason before mutating
    const moderateSpy = vi.spyOn(reviewsApi, "moderateAdminReview");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm approval" }),
    );
    expect(
      within(dialog).getByText(
        "Moderation reason must be at least 3 characters.",
      ),
    ).toBeInTheDocument();
    expect(moderateSpy).not.toHaveBeenCalled();

    // Simulate 409 lock_version conflict on first submission
    moderateSpy.mockRejectedValueOnce(
      new ApiError({
        title: "Version conflict",
        status: 409,
        detail: "This review was modified concurrently. Refresh and try again.",
      }),
    );

    const reasonInput = within(dialog).getByLabelText(/Moderation reason/i);
    fireEvent.change(reasonInput, {
      target: { value: "Verified helpful customer review." },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm approval" }),
    );

    expect(
      await within(dialog).findByText(/This review was modified concurrently/i),
    ).toBeInTheDocument();

    const getDetailSpy = vi
      .spyOn(reviewsApi, "getAdminReview")
      .mockResolvedValue({
        ...samplePendingReview,
        lock_version: 3,
      });

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Reload latest review" }),
    );
    await waitFor(() => {
      expect(getDetailSpy).toHaveBeenCalledTimes(2);
    });

    // Now approve cleanly with updated lock_version=3
    const approvedReview: AdminReview = {
      ...samplePendingReview,
      status: "approved",
      moderation_reason: "Verified helpful customer review.",
      lock_version: 4,
      published_at: "2026-11-11T12:00:00.000Z",
      moderated_at: "2026-11-11T12:00:00.000Z",
      moderator: { id: 1, name: "Super Moderator" },
      audit_logs: [
        {
          id: 302,
          action: "review.approved",
          actor: { id: 1, name: "Super Moderator" },
          before: { status: "pending" },
          after: {
            status: "approved",
            moderation_reason: "Verified helpful customer review.",
          },
          ip_address: "127.0.0.1",
          created_at: "2026-11-11T12:00:00.000Z",
        },
        ...samplePendingReview.audit_logs!,
      ],
    };

    moderateSpy.mockResolvedValueOnce(approvedReview);
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue(approvedReview);

    fireEvent.change(within(dialog).getByLabelText(/Moderation reason/i), {
      target: { value: "Verified helpful customer review." },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm approval" }),
    );

    await waitFor(() => {
      expect(moderateSpy).toHaveBeenLastCalledWith(44, {
        status: "approved",
        reason: "Verified helpful customer review.",
        lock_version: 3,
      });
    });

    expect(
      await within(dialog).findByText("Review #44 has been approved and published."),
    ).toBeInTheDocument();
  });

  it("creates, edits, and deletes official GlowCare replies from the detail modal", async () => {
    const approvedReview: AdminReview = {
      ...samplePendingReview,
      status: "approved",
      reply: null,
    };

    vi.spyOn(reviewsApi, "listAdminReviews").mockResolvedValue({
      data: [approvedReview],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 1,
        total: 1,
      },
    });
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue(approvedReview);

    const createdReply = {
      id: 88,
      body: "Thank you for trying GlowCare!",
      author_name: "Super Moderator",
      admin_user_id: 1,
      created_at: "2026-11-11T13:00:00.000Z",
      updated_at: "2026-11-11T13:00:00.000Z",
    };

    const createReplySpy = vi
      .spyOn(reviewsApi, "createAdminReviewReply")
      .mockResolvedValue(createdReply);
    const updateReplySpy = vi
      .spyOn(reviewsApi, "updateAdminReviewReply")
      .mockResolvedValue({
        ...createdReply,
        body: "Updated official thank-you note.",
        updated_at: "2026-11-11T13:05:00.000Z",
      });
    const deleteReplySpy = vi
      .spyOn(reviewsApi, "deleteAdminReviewReply")
      .mockResolvedValue();

    renderWithAdmin(<ReviewsPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Inspect review #44" }),
    );

    const dialog = await screen.findByRole("dialog");

    // Create reply
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue({
      ...approvedReview,
      reply: createdReply,
    });
    fireEvent.change(within(dialog).getByLabelText(/Write official reply/i), {
      target: { value: "Thank you for trying GlowCare!" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Publish reply" }),
    );

    await waitFor(() => {
      expect(createReplySpy).toHaveBeenCalledWith(
        44,
        "Thank you for trying GlowCare!",
      );
    });
    expect(
      await within(dialog).findByText("Thank you for trying GlowCare!"),
    ).toBeInTheDocument();

    // Edit reply
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue({
      ...approvedReview,
      reply: {
        ...createdReply,
        body: "Updated official thank-you note.",
        updated_at: "2026-11-11T13:05:00.000Z",
      },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit reply" }));
    fireEvent.change(within(dialog).getByLabelText(/Update official reply/i), {
      target: { value: "Updated official thank-you note." },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save updated reply" }),
    );

    await waitFor(() => {
      expect(updateReplySpy).toHaveBeenCalledWith(
        44,
        "Updated official thank-you note.",
      );
    });
    expect(
      await within(dialog).findByText("Updated official thank-you note."),
    ).toBeInTheDocument();

    // Delete reply with inline confirmation
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue(approvedReview);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete reply" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm delete reply" }),
    );

    await waitFor(() => {
      expect(deleteReplySpy).toHaveBeenCalledWith(44);
    });
  });

  it("escapes untrusted XSS payloads in review content, moderation reason, and official reply", async () => {
    const xssTitle = '<script>alert("xss")</script>';
    const xssBody = '<img src=x onerror="alert(1)">Great moisturizer';
    const xssReason = '<svg onload="alert(2)">Approved by policy';
    const xssReply = '<iframe src="javascript:alert(3)">Thanks!';

    const xssReview: AdminReview = {
      ...samplePendingReview,
      status: "approved",
      title: xssTitle,
      body: xssBody,
      moderation_reason: xssReason,
      media: [],
      reply: {
        id: 99,
        body: xssReply,
        author_name: "Super Moderator",
        created_at: "2026-11-11T14:00:00.000Z",
        updated_at: "2026-11-11T14:00:00.000Z",
      },
    };

    vi.spyOn(reviewsApi, "listAdminReviews").mockResolvedValue({
      data: [xssReview],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 1,
        total: 1,
      },
    });
    vi.spyOn(reviewsApi, "getAdminReview").mockResolvedValue(xssReview);

    const { container } = renderWithAdmin(<ReviewsPage />);

    expect(await screen.findByText(xssTitle)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inspect review #44" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(xssBody)).toBeInTheDocument();
    expect(within(dialog).getAllByText(xssReason).length).toBeGreaterThanOrEqual(1);
    expect(within(dialog).getByText(xssReply)).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });
});
