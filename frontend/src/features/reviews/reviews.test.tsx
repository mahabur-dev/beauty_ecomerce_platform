import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "@/features/auth/api";
import type { AuthUser } from "@/features/auth/types";
import { ApiError } from "@/lib/api/api-error";

import * as reviewsApi from "./api";
import { ProductReviewsSection } from "./components/product-reviews-section";
import type {
  OwnReview,
  PublicReviewsResponse,
  ReviewMediaItem,
  ReviewSummary,
} from "./types";

const mockPathname = "/products/deep-hydration-lotion";
const mockSearchParams = new URLSearchParams("variant=2");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const verifiedCustomer: AuthUser = {
  id: 14,
  name: "Nadia Karim",
  email: "nadia@example.com",
  email_verified: true,
  is_active: true,
  vendor_id: null,
  roles: ["customer"],
  mfa_enabled: false,
};

const unverifiedCustomer: AuthUser = {
  ...verifiedCustomer,
  email_verified: false,
};

const sampleSummary: ReviewSummary = {
  average_rating: 4.5,
  total_reviews: 4,
  distribution: {
    "5": 3,
    "4": 0,
    "3": 1,
    "2": 0,
    "1": 0,
  },
};

const publicListResponse: PublicReviewsResponse = {
  data: [
    {
      id: 101,
      rating: 5,
      title: "Gentle and glowy",
      body: "Absorbs smoothly and leaves zero sticky residue.",
      verified_purchase: true,
      published_at: "2026-11-08T10:00:00.000Z",
      author: { name: "Samira Chowdhury" },
      media: [
        {
          id: 501,
          review_id: 101,
          kind: "image",
          format: "webp",
          mime_type: "image/webp",
          bytes: 204800,
          width: 800,
          height: 800,
          duration_seconds: null,
          sort_order: 0,
          status: "ready",
          url: "https://api.cloudinary.com/v1_1/demo/image/download?token=pub",
          url_expires_at: "2099-01-01T00:00:00.000Z",
          created_at: "2026-11-08T09:50:00.000Z",
        },
      ],
      reply: {
        id: 21,
        body: "Thank you for sharing your GlowCare experience!",
        author_name: "GlowCare Support",
        created_at: "2026-11-08T12:00:00.000Z",
        updated_at: "2026-11-08T12:00:00.000Z",
      },
    },
  ],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 2,
    per_page: 10,
    to: 1,
    total: 4,
  },
  summary: sampleSummary,
};

const samplePendingMedia: ReviewMediaItem = {
  id: 700,
  review_id: 205,
  kind: "image",
  format: "jpg",
  mime_type: "image/jpeg",
  bytes: 150000,
  width: 600,
  height: 600,
  duration_seconds: null,
  sort_order: 0,
  status: "ready",
  url: "https://api.cloudinary.com/v1_1/demo/image/download?token=priv1",
  url_expires_at: "2099-01-01T00:00:00.000Z",
  created_at: "2026-11-10T10:00:00.000Z",
};

const sampleOwnPendingReview: OwnReview = {
  id: 205,
  product_id: 7,
  rating: 4,
  title: "Very soothing lotion",
  body: "Works great after evening cleansing.",
  status: "pending",
  verified_purchase: false,
  moderation_reason: null,
  lock_version: 1,
  submitted_at: "2026-11-10T10:00:00.000Z",
  published_at: null,
  moderated_at: null,
  created_at: "2026-11-10T10:00:00.000Z",
  updated_at: "2026-11-10T10:00:00.000Z",
  media: [samplePendingMedia],
  reply: null,
};

function renderWithQueryClient(ui: ReactNode, currentUser?: AuthUser | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  if (currentUser !== undefined) {
    client.setQueryData(["auth", "current-user"], currentUser);
  }

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("ProductReviewsSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:review-preview"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(reviewsApi, "getProductReviewSummary").mockResolvedValue(
      sampleSummary,
    );
    vi.spyOn(reviewsApi, "getProductReviews").mockResolvedValue(
      publicListResponse,
    );
    vi.spyOn(reviewsApi, "getMyProductReview").mockResolvedValue(null);
  });

  it("renders summary, approved review with media & official reply, and triggers filter/sort/pagination queries", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);
    const getReviewsSpy = vi
      .spyOn(reviewsApi, "getProductReviews")
      .mockResolvedValue(publicListResponse);

    renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      null,
    );

    expect(
      await screen.findByText("Gentle and glowy"),
    ).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(
      screen.queryByText(/Based on \d+ approved reviews?/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Verified Purchase")).toBeInTheDocument();
    expect(screen.getByText("GlowCare Support")).toBeInTheDocument();
    expect(screen.getByText("Official Response")).toBeInTheDocument();

    // Guest CTA preserves current page + variant query via ?next=
    const signInLink = screen.getByRole("link", {
      name: "Sign in to write a review",
    });
    expect(signInLink).toHaveAttribute(
      "href",
      "/login?next=%2Fproducts%2Fdeep-hydration-lotion%3Fvariant%3D2",
    );

    // Filter by 5 stars from distribution bar / pill
    fireEvent.click(screen.getByRole("button", { name: /^5\s*$/i }));
    await waitFor(() => {
      expect(getReviewsSpy).toHaveBeenCalledWith(
        "deep-hydration-lotion",
        expect.objectContaining({ rating: 5, page: 1 }),
      );
    });

    // Toggle "With photos"
    fireEvent.click(screen.getByRole("button", { name: /With photos/i }));
    await waitFor(() => {
      expect(getReviewsSpy).toHaveBeenCalledWith(
        "deep-hydration-lotion",
        expect.objectContaining({ withMedia: true, page: 1 }),
      );
    });

    // Sort via SelectDropdown
    fireEvent.click(
      screen.getByRole("button", { name: "Sort customer reviews" }),
    );
    fireEvent.click(screen.getByRole("option", { name: "Highest rating" }));
    await waitFor(() => {
      expect(getReviewsSpy).toHaveBeenCalledWith(
        "deep-hydration-lotion",
        expect.objectContaining({ sort: "highest", page: 1 }),
      );
    });

    // Pagination page 2
    const paginationNav = screen.getByRole("navigation", {
      name: "Review pages",
    });
    fireEvent.click(within(paginationNav).getByRole("button", { name: "2" }));
    await waitFor(() => {
      expect(getReviewsSpy).toHaveBeenCalledWith(
        "deep-hydration-lotion",
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("prompts signed-in users without verified email before allowing reviews", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(unverifiedCustomer);

    renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      unverifiedCustomer,
    );

    expect(
      await screen.findByText("Email verification required"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Verify email" }),
    ).toHaveAttribute("href", "/verify-email");
  });

  it("submits a new review with signed media upload and transitions into Pending moderation state", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(verifiedCustomer);
    const getMineSpy = vi
      .spyOn(reviewsApi, "getMyProductReview")
      .mockResolvedValueOnce(null)
      .mockResolvedValue(sampleOwnPendingReview);

    const createReviewSpy = vi
      .spyOn(reviewsApi, "createProductReview")
      .mockResolvedValue({ ...sampleOwnPendingReview, media: [] });

    const createIntentSpy = vi
      .spyOn(reviewsApi, "createReviewMediaIntent")
      .mockResolvedValue({
        intent_token: "intent-uuid-1",
        kind: "image",
        expires_at: "2099-01-01T00:10:00.000Z",
        max_bytes: 5_242_880,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        upload: {
          url: "https://api.cloudinary.com/v1_1/demo/image/upload",
          method: "POST",
          fields: { signature: "sig-123", timestamp: 1700000000 },
        },
      });

    const uploadSpy = vi
      .spyOn(reviewsApi, "uploadMediaToCloudinarySigned")
      .mockImplementation(async (_upload, _file, opts) => {
        opts?.onProgress?.(60);
        opts?.onProgress?.(100);
      });

    const finalizeSpy = vi
      .spyOn(reviewsApi, "finalizeReviewMedia")
      .mockResolvedValue(samplePendingMedia);

    renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      verifiedCustomer,
    );

    const writeBtn = await screen.findByRole("button", {
      name: "Write a Review",
    });
    fireEvent.click(writeBtn);

    // Headline field must not be rendered; rating-only submit without review text is blocked.
    expect(screen.queryByLabelText(/Review headline/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "4 stars — Very good" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));
    expect(
      screen.getByText("Please write your review before submitting."),
    ).toBeInTheDocument();
    expect(createReviewSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Your review/i), {
      target: { value: "Works great after evening cleansing." },
    });

    const photo = new File(["binary"], "bottle.jpg", { type: "image/jpeg" });
    Object.defineProperty(photo, "size", { value: 150000 });
    const fileInput = screen.getByLabelText(/Add product photos/i);
    fireEvent.change(fileInput, { target: { files: [photo] } });

    await screen.findByText("bottle.jpg");

    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(createReviewSpy).toHaveBeenCalledWith("deep-hydration-lotion", {
        rating: 4,
        body: "Works great after evening cleansing.",
      });
    });

    await waitFor(() => {
      expect(createIntentSpy).toHaveBeenCalledWith(205, {
        kind: "image",
        format: "jpg",
        mime_type: "image/jpeg",
        bytes: 150000,
        duration_seconds: null,
      });
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(finalizeSpy).toHaveBeenCalledWith(205, {
        token: "intent-uuid-1",
        sort_order: 0,
      });
      expect(getMineSpy).toHaveBeenCalledTimes(2);
    });

    expect(
      await screen.findByText("Pending moderation"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Your Review" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Your review")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "My review" }),
    ).toBeInTheDocument();
  });

  it("handles media upload failure with Retry and Remove (canceling intent cleanly)", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(verifiedCustomer);
    vi.spyOn(reviewsApi, "getMyProductReview").mockResolvedValue(null);
    vi.spyOn(reviewsApi, "createProductReview").mockResolvedValue({
      ...sampleOwnPendingReview,
      media: [],
    });

    vi.spyOn(reviewsApi, "createReviewMediaIntent").mockResolvedValue({
      intent_token: "intent-retry-1",
      kind: "image",
      expires_at: "2099-01-01T00:10:00.000Z",
      max_bytes: 5_242_880,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      upload: {
        url: "https://api.cloudinary.com/v1_1/demo/image/upload",
        method: "POST",
        fields: { signature: "sig-xyz" },
      },
    });
    const cancelSpy = vi
      .spyOn(reviewsApi, "cancelReviewMediaIntent")
      .mockResolvedValue();

    let attempt = 0;
    vi.spyOn(reviewsApi, "uploadMediaToCloudinarySigned").mockImplementation(
      async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error("Storage network timeout");
        }
      },
    );
    const finalizeSpy = vi
      .spyOn(reviewsApi, "finalizeReviewMedia")
      .mockResolvedValue(samplePendingMedia);

    renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      verifiedCustomer,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Write a Review" }));

    fireEvent.change(screen.getByLabelText(/Your review/i), {
      target: { value: "Testing retry upload with required review text." },
    });

    const photo = new File(["img"], "failed-first.png", { type: "image/png" });
    Object.defineProperty(photo, "size", { value: 64000 });
    fireEvent.change(screen.getByLabelText(/Add product photos/i), {
      target: { files: [photo] },
    });
    await screen.findByText("failed-first.png");

    // Mock transitions getMyProductReview after create to return saved pending review
    vi.spyOn(reviewsApi, "getMyProductReview").mockResolvedValue({
      ...sampleOwnPendingReview,
      media: [],
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(205, "intent-retry-1");
    });

    expect(
      await screen.findByText("Storage network timeout"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(finalizeSpy).toHaveBeenCalledWith(205, {
        token: "intent-retry-1",
        sort_order: 0,
      });
    });
  });

  it("shows own approved review inline without duplication, supports My review filter, refreshes media URL, handles 409 & deletes", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(verifiedCustomer);
    const approvedOwnReview: OwnReview = {
      ...sampleOwnPendingReview,
      status: "approved",
      published_at: "2026-11-09T12:00:00.000Z",
      lock_version: 2,
    };

    vi.spyOn(reviewsApi, "getMyProductReview").mockResolvedValue(
      approvedOwnReview,
    );
    vi.spyOn(reviewsApi, "getProductReviews").mockResolvedValue({
      ...publicListResponse,
      data: [
        ...publicListResponse.data,
        {
          id: approvedOwnReview.id,
          rating: approvedOwnReview.rating,
          title: approvedOwnReview.title,
          body: approvedOwnReview.body,
          verified_purchase: approvedOwnReview.verified_purchase,
          published_at: approvedOwnReview.published_at,
          author: { name: verifiedCustomer.name },
          media: approvedOwnReview.media,
          reply: null,
        },
      ],
    });

    const refreshUrlSpy = vi
      .spyOn(reviewsApi, "refreshReviewMediaUrl")
      .mockResolvedValue({
        ...samplePendingMedia,
        url: "https://api.cloudinary.com/v1_1/demo/image/download?token=refreshed",
      });

    renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      verifiedCustomer,
    );

    expect(await screen.findByText("Your review")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Your Review" }),
    ).not.toBeInTheDocument();
    // Both other customer reviews and own review appear once in the same list
    expect(screen.getByText("Samira Chowdhury")).toBeInTheDocument();
    expect(screen.getAllByText(approvedOwnReview.body!)).toHaveLength(1);

    // Filter down to only own review and back out to all reviews
    fireEvent.click(screen.getByRole("button", { name: "My review" }));
    expect(screen.queryByText("Samira Chowdhury")).not.toBeInTheDocument();
    expect(screen.getByText(approvedOwnReview.body!)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "My review" }));
    expect(await screen.findByText("Samira Chowdhury")).toBeInTheDocument();

    // Trigger image load failure to verify automatic owner signed URL refresh
    const ownImg = screen.getByAltText("Review photo 1 from you");
    fireEvent.error(ownImg);
    await waitFor(() => {
      expect(refreshUrlSpy).toHaveBeenCalledWith(205, 700);
    });

    // Open Edit mode & inspect approved-edit moderation warning
    fireEvent.click(screen.getByRole("button", { name: "Edit review" }));
    expect(
      screen.getByText(/Editing an approved review or changing its photos\/videos/i),
    ).toBeInTheDocument();

    // Simulate 409 Version conflict on Save Changes
    vi.spyOn(reviewsApi, "updateProductReview").mockRejectedValueOnce(
      new ApiError({
        title: "Version conflict",
        status: 409,
        detail: "This review was modified concurrently. Refresh and try again.",
      }),
    );

    fireEvent.change(screen.getByLabelText(/Your review/i), {
      target: { value: "Updated review body after 4 weeks." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText(/This review was modified concurrently/i),
    ).toBeInTheDocument();

    const reloadLatestSpy = vi
      .spyOn(reviewsApi, "getMyReviewById")
      .mockResolvedValue({
        ...approvedOwnReview,
        lock_version: 3,
      });

    fireEvent.click(
      screen.getByRole("button", { name: "Reload latest review" }),
    );
    await waitFor(() => {
      expect(reloadLatestSpy).toHaveBeenCalledWith(205);
    });

    // Cancel edit and delete review via confirmation modal
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]!);

    const deleteSpy = vi
      .spyOn(reviewsApi, "deleteProductReview")
      .mockResolvedValue();
    vi.spyOn(reviewsApi, "getMyProductReview").mockResolvedValue(null);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete review" }),
    );

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(205);
    });

    expect(
      await screen.findByRole("button", { name: "Write a Review" }),
    ).toBeInTheDocument();
  });

  it("renders untrusted XSS payloads strictly as escaped text nodes", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(null);
    const xssTitle = '<script>window.__xss=1</script>';
    const xssBody = '<img src=x onerror="alert(1)">Smooth finish';
    const xssReply = '<svg onload="alert(2)">Official note';

    vi.spyOn(reviewsApi, "getProductReviews").mockResolvedValue({
      ...publicListResponse,
      data: [
        {
          ...publicListResponse.data[0]!,
          title: xssTitle,
          body: xssBody,
          media: [],
          reply: {
            ...publicListResponse.data[0]!.reply!,
            body: xssReply,
          },
        },
      ],
    });

    const { container } = renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      null,
    );

    expect(await screen.findByText(xssTitle)).toBeInTheDocument();
    expect(screen.getByText(xssBody)).toBeInTheDocument();
    expect(screen.getByText(xssReply)).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("automatically dismisses review update feedback after 4 seconds", async () => {
    vi.spyOn(authApi, "getCurrentUser").mockResolvedValue(verifiedCustomer);
    vi.spyOn(reviewsApi, "getMyProductReview").mockResolvedValue(
      sampleOwnPendingReview,
    );
    vi.spyOn(reviewsApi, "updateProductReview").mockResolvedValue({
      ...sampleOwnPendingReview,
      body: "Freshly updated commentary.",
      lock_version: 2,
    });

    renderWithQueryClient(
      <ProductReviewsSection
        productSlug="deep-hydration-lotion"
        productName="Deep Hydration Lotion"
      />,
      verifiedCustomer,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Edit review" }));

    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      fireEvent.change(screen.getByLabelText(/Your review/i), {
        target: { value: "Freshly updated commentary." },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      expect(
        await screen.findByText(
          "Your review has been updated and queued for moderation.",
        ),
      ).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4200);
      });

      expect(
        screen.queryByText(
          "Your review has been updated and queued for moderation.",
        ),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

