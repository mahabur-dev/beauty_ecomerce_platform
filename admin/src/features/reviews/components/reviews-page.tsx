"use client";

import { useState } from "react";
import {
  ActionButton,
  DismissibleNotice,
  IconAction,
  ListToolbar,
  PageHeading,
  Pagination,
  Panel,
  SelectDropdown,
  StatCard,
  StatusBadge,
  TableEmpty,
  TableScroll,
} from "@/components/ui/admin-primitives";
import { Icon } from "@/components/ui/icon";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import { hasPermission } from "@/features/auth/permissions";
import { useAdmin } from "@/features/auth/use-admin";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import type {
  AdminReview,
  ReviewSort,
  ReviewStatus,
  ReviewTrashFilter,
} from "../contracts";
import { reviewErrorMessage } from "../errors";
import { useAdminReviews, useReviewProductOptions } from "../queries";
import { formatReviewShortDate } from "../utils";
import { ReviewDetailModal } from "./review-detail-modal";
import { ReviewStars } from "./review-stars";

const PAGE_SIZE = 10;

const reviewStatusOptions = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
] as const;

const reviewRatingOptions = [
  { value: "all", label: "All ratings" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
] as const;

const reviewSortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest rating" },
  { value: "lowest", label: "Lowest rating" },
] as const;

const reviewTrashOptions = [
  { value: "without", label: "Active reviews" },
  { value: "with", label: "Include deleted" },
  { value: "only", label: "Deleted only" },
] as const;

export function ReviewsPage() {
  const { data: user } = useAdmin();
  const canModerate = Boolean(user && hasPermission(user, "reviews.moderate"));

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [rating, setRating] = useState<string>("all");
  const [productId, setProductId] = useState<string>("all");
  const [withMedia, setWithMedia] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [trash, setTrash] = useState<ReviewTrashFilter>("without");
  const [page, setPage] = useState(1);

  const [inspecting, setInspecting] = useState<AdminReview | null>(null);
  const [notice, setNotice] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const hasInvalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const reviewsQuery = useAdminReviews({
    page,
    perPage: PAGE_SIZE,
    search: debouncedSearch,
    status,
    rating: rating === "all" ? "all" : Number(rating),
    productId: productId === "all" ? "all" : Number(productId),
    withMedia,
    dateFrom: hasInvalidDateRange ? undefined : dateFrom || undefined,
    dateTo: hasInvalidDateRange ? undefined : dateTo || undefined,
    trash,
    sort,
  });

  const productOptionsQuery = useReviewProductOptions();
  const reviews = reviewsQuery.data?.data ?? [];
  const meta = reviewsQuery.data?.meta;

  const hasActiveFilters = Boolean(
    search.trim() ||
      status !== "all" ||
      rating !== "all" ||
      productId !== "all" ||
      withMedia ||
      dateFrom ||
      dateTo ||
      trash !== "without" ||
      sort !== "newest",
  );

  const pendingOnPage = reviews.filter(
    (item) => item.status === "pending",
  ).length;
  const approvedOnPage = reviews.filter(
    (item) => item.status === "approved",
  ).length;
  const withMediaOnPage = reviews.filter(
    (item) => item.media.length > 0,
  ).length;

  function resetPage(update: () => void) {
    update();
    setPage(1);
  }

  function handleResetFilters() {
    setSearch("");
    setStatus("all");
    setRating("all");
    setProductId("all");
    setWithMedia(false);
    setDateFrom("");
    setDateTo("");
    setTrash("without");
    setSort("newest");
    setPage(1);
  }

  return (
    <PermissionGate permission="reviews.read">
      <div className="catalog-page">
        <PageHeading
          eyebrow="MODERATION & FEEDBACK"
          title="Customer reviews"
          description="Inspect customer feedback, review private pending media, moderate publication status, and manage official replies."
          action={
            <ActionButton
              variant="secondary"
              disabled={reviewsQuery.isFetching}
              onClick={() => void reviewsQuery.refetch()}
            >
              <Icon name="refresh" size={15} />
              {reviewsQuery.isFetching ? "Refreshing…" : "Refresh list"}
            </ActionButton>
          }
        />

        <div className="catalog-stats-grid">
          <StatCard
            label="Total reviews"
            value={meta?.total ?? "—"}
            detail="Server-paginated result total"
            icon="star"
          />
          <StatCard
            label="Pending reviews"
            value={pendingOnPage}
            detail="Awaiting moderation decision"
            icon="clock"
            tone="orange"
          />
          <StatCard
            label="Total medias"
            value={withMediaOnPage}
            detail="Customer photos or videos"
            icon="film"
            tone="purple"
          />
          <StatCard
            label="Total approved reviews"
            value={approvedOnPage}
            detail="Visible on customer storefront"
            icon="check"
            tone="green"
          />
        </div>

        {notice ? (
          <DismissibleNotice
            variant="success"
            message={notice}
            onDismiss={() => setNotice("")}
          />
        ) : null}

        {hasInvalidDateRange ? (
          <DismissibleNotice
            variant="warning"
            durationMs={0}
            message="The submitted end date cannot be earlier than the start date."
          />
        ) : null}

        {reviewsQuery.isError ? (
          <DismissibleNotice
            variant="error"
            durationMs={0}
            message={reviewErrorMessage(reviewsQuery.error)}
          />
        ) : null}

        <Panel
          title="Moderation queue"
          subtitle="Filter by status, star rating, product, attachments, submission date, or deletion status."
          action={
            <span className="catalog-count">
              {meta?.total ?? 0} {meta?.total === 1 ? "review" : "reviews"}
            </span>
          }
        >
          <ListToolbar
            search={search}
            setSearch={(value) => resetPage(() => setSearch(value))}
            status={status}
            setStatus={(value) =>
              resetPage(() => setStatus(value as ReviewStatus | "all"))
            }
            statusOptions={reviewStatusOptions}
            searchLabel="Search reviews"
            statusLabel="Filter review status"
            placeholder="Search headline, text, customer, or product…"
          >
            <SelectDropdown
              id="reviews-filter-rating"
              aria-label="Filter by rating"
              value={rating}
              onChange={(value) => resetPage(() => setRating(value))}
              options={reviewRatingOptions}
              menuHeader="Star rating"
            />
            <SelectDropdown
              id="reviews-filter-product"
              aria-label="Filter by product"
              value={productId}
              onChange={(value) => resetPage(() => setProductId(value))}
              options={[
                { value: "all", label: "All products" },
                ...(productOptionsQuery.data ?? []).map((product) => ({
                  value: String(product.id),
                  label: product.name,
                })),
              ]}
              menuHeader="Product"
            />
            <SelectDropdown
              id="reviews-sort"
              aria-label="Sort reviews"
              value={sort}
              onChange={(value) =>
                resetPage(() => setSort(value as ReviewSort))
              }
              options={reviewSortOptions}
              menuHeader="Sort order"
            />
          </ListToolbar>

          <div className="reviews-filter-bar">
            <label className="reviews-date-field">
              <span>From</span>
              <input
                type="date"
                aria-label="Submitted from date"
                value={dateFrom}
                onChange={(event) =>
                  resetPage(() => setDateFrom(event.target.value))
                }
              />
            </label>

            <label className="reviews-date-field">
              <span>To</span>
              <input
                type="date"
                aria-label="Submitted to date"
                value={dateTo}
                onChange={(event) =>
                  resetPage(() => setDateTo(event.target.value))
                }
              />
            </label>

            <button
              type="button"
              aria-pressed={withMedia}
              onClick={() => resetPage(() => setWithMedia((prev) => !prev))}
              className={`reviews-toggle-chip ${
                withMedia ? "reviews-toggle-chip-active" : ""
              }`}
            >
              <Icon name="film" size={14} />
              <span>With media only</span>
            </button>

            <SelectDropdown
              id="reviews-filter-trash"
              aria-label="Trash visibility"
              value={trash}
              onChange={(value) =>
                resetPage(() => setTrash(value as ReviewTrashFilter))
              }
              options={reviewTrashOptions}
              menuHeader="Deletion state"
            />

            {hasActiveFilters ? (
              <ActionButton variant="ghost" onClick={handleResetFilters}>
                Reset filters
              </ActionButton>
            ) : null}
          </div>

          <TableScroll ariaLabel="Customer reviews moderation table">
            <table
              className="catalog-table"
              aria-busy={reviewsQuery.isFetching}
            >
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Rating &amp; Review</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                  <th scope="col" className="catalog-actions-heading">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="catalog-category-name">
                        <strong>
                          {item.product?.name ?? `Product #${item.product_id}`}
                        </strong>
                        <small>
                          {item.product?.slug
                            ? `/${item.product.slug}`
                            : ""}{" "}
                          · #{item.id}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="catalog-category-name">
                        <strong>
                          {item.author?.name ?? `User #${item.user_id}`}
                        </strong>
                        <small>{item.author?.email ?? "—"}</small>
                        {item.verified_purchase ? (
                          <div className="reviews-meta-pills">
                            <span className="reviews-pill reviews-pill-brand">
                              Verified purchase
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="reviews-cell-snippet">
                        <ReviewStars rating={item.rating} size={13} showNumeric />
                        <strong>{item.title || "No headline"}</strong>
                        {item.body ? <p>{item.body}</p> : null}
                        <div className="reviews-meta-pills">
                          {item.media.length > 0 ? (
                            <span className="reviews-pill">
                              {item.media.length} media
                            </span>
                          ) : null}
                          {item.reply ? (
                            <span className="reviews-pill reviews-pill-brand">
                              Official reply
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge value={item.status} />
                        {item.deleted_at ? (
                          <span className="reviews-pill reviews-pill-danger">
                            Deleted
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="catalog-category-name">
                        <strong>
                          {formatReviewShortDate(
                            item.submitted_at ?? item.created_at,
                          )}
                        </strong>
                        {item.moderator ? (
                          <small>By {item.moderator.name}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="catalog-actions">
                        <IconAction
                          label={`Inspect review #${item.id}`}
                          onClick={() => setInspecting(item)}
                        >
                          <Icon name="eye" size={15} />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>

          {reviewsQuery.isLoading ? (
            <div aria-label="Loading reviews">
              {[1, 2, 3].map((row) => (
                <div key={row} className="reviews-skeleton-row" />
              ))}
            </div>
          ) : null}

          {!reviewsQuery.isLoading && !reviews.length ? (
            <TableEmpty
              label="No matching reviews"
              description={
                hasActiveFilters
                  ? "No customer reviews matched your active filters."
                  : "Customer reviews submitted on the storefront will appear here."
              }
              action={
                hasActiveFilters ? (
                  <ActionButton
                    variant="secondary"
                    onClick={handleResetFilters}
                  >
                    Clear filters
                  </ActionButton>
                ) : undefined
              }
            />
          ) : null}

          <Pagination
            count={meta?.total ?? 0}
            page={meta?.current_page ?? page}
            onPageChange={setPage}
            size={PAGE_SIZE}
          />
        </Panel>
      </div>

      {inspecting ? (
        <ReviewDetailModal
          reviewId={inspecting.id}
          initialReview={inspecting}
          canModerate={canModerate}
          onNotice={(msg) => setNotice(msg)}
          onClose={() => setInspecting(null)}
        />
      ) : null}
    </PermissionGate>
  );
}

