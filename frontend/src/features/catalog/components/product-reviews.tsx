"use client";

import { CheckCircle2, MessageSquarePlus, Star, ThumbsUp } from "lucide-react";
import { useState, type FormEvent } from "react";

import { buttonStyles } from "@/components/ui";

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  helpfulCount: number;
}

const initialReviews: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Jessica Turner",
    rating: 5,
    date: "November 5, 2026",
    title: "Absolute game changer for my skin!",
    comment:
      "I've been using this for two weeks now and the difference is incredible. The texture is lightweight, absorbs quickly, and gives my skin a natural radiant glow without feeling greasy.",
    verified: true,
    helpfulCount: 14,
  },
  {
    id: "rev-2",
    name: "Sarah Miller",
    rating: 5,
    date: "October 29, 2026",
    title: "Worth every single penny",
    comment:
      "High quality ingredients, premium packaging, and results that speak for themselves. Highly recommended for daily beauty routines!",
    verified: true,
    helpfulCount: 9,
  },
  {
    id: "rev-3",
    name: "Amina Rahman",
    rating: 4,
    date: "October 18, 2026",
    title: "Very hydrating and gentle",
    comment:
      "Great product for sensitive skin. Does not irritate at all and keeps skin hydrated throughout the entire day. Smells subtle and pleasant.",
    verified: true,
    helpfulCount: 6,
  },
];

const ratingBreakdown = [
  { stars: 5, percentage: 85, count: 41 },
  { stars: 4, percentage: 10, count: 5 },
  { stars: 3, percentage: 3, count: 1 },
  { stars: 2, percentage: 1, count: 1 },
  { stars: 1, percentage: 0, count: 0 },
];

export function ProductReviews({ productName }: { productName: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleSubmitReview(e: FormEvent) {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: reviewerName.trim(),
      rating: userRating,
      date: "Just now",
      title: reviewTitle.trim() || "Customer Review",
      comment: reviewComment.trim(),
      verified: true,
      helpfulCount: 0,
    };

    setReviews([newReview, ...reviews]);
    setReviewerName("");
    setReviewTitle("");
    setReviewComment("");
    setUserRating(5);
    setShowForm(false);
    setSuccessMessage("Thank you! Your review has been submitted successfully.");

    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  }

  return (
    <section id="product-reviews" className="scroll-mt-20">
      <div className="border-b border-brand-100 pb-5">
        <h2 className="text-ink text-2xl font-extrabold sm:text-3xl">
          Customer Reviews & Ratings
        </h2>
        <p className="text-ink-muted mt-1 text-sm">
          Real feedback from verified purchasers of {productName}.
        </p>
      </div>

      {/* Ratings summary breakdown card */}
      <div className="border-line bg-surface-elevated shadow-soft mt-8 grid grid-cols-1 gap-8 rounded-3xl border p-6 sm:p-8 lg:grid-cols-[1fr_1.5fr_1fr] lg:items-center">
        {/* Left: Overall score */}
        <div className="flex flex-col items-center justify-center text-center sm:border-r sm:border-line sm:pr-6">
          <span className="text-ink text-5xl font-black">4.9</span>
          <div className="mt-2 flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="size-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-ink-muted mt-2 text-xs font-semibold">
            Based on {reviews.length + 45} customer ratings
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="size-3.5" /> 98% recommend this product
          </span>
        </div>

        {/* Middle: Star breakdown progress bars */}
        <div className="space-y-2">
          {ratingBreakdown.map((item) => (
            <div key={item.stars} className="flex items-center gap-3 text-xs font-medium">
              <span className="text-ink w-12 text-right font-semibold">
                {item.stars} stars
              </span>
              <div className="bg-brand-100/60 h-2.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-ink-muted w-8 text-left">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>

        {/* Right: Write review trigger */}
        <div className="flex flex-col items-center justify-center gap-3 text-center sm:border-l sm:border-line sm:pl-6">
          <p className="text-ink text-sm font-bold">Have you tried this product?</p>
          <p className="text-ink-muted text-xs">
            Share your experience and thoughts with other shoppers.
          </p>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className={buttonStyles({
              variant: "primary",
              size: "sm",
              className: "gap-2 rounded-xl font-bold",
            })}
          >
            <MessageSquarePlus className="size-4" />
            {showForm ? "Close Review Form" : "Write a Review"}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage ? (
        <div
          role="status"
          className="border-emerald-200 bg-emerald-50 text-emerald-800 mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold animate-in fade-in"
        >
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {/* Interactive Write a Review Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmitReview}
          className="border-brand-200 bg-brand-50/40 mt-8 rounded-3xl border p-6 sm:p-8 animate-in fade-in slide-in-from-top-2"
        >
          <h3 className="text-ink text-lg font-bold sm:text-xl">
            Write your product review
          </h3>
          <p className="text-ink-muted mt-1 text-xs">
            Your honest rating helps the GlowCare community find the best products.
          </p>

          {/* Star selector */}
          <div className="mt-5">
            <span className="text-ink block text-xs font-bold uppercase tracking-wider">
              Your overall rating:
            </span>
            <div className="mt-2 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  className="cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                >
                  <Star
                    className={`size-7 transition-colors ${
                      star <= (hoverRating || userRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-brand-200"
                    }`}
                  />
                </button>
              ))}
              <span className="text-ink ml-2 text-sm font-bold">
                {hoverRating || userRating} / 5 stars
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-ink mb-1.5 block text-xs font-bold">
                Your Name *
              </span>
              <input
                type="text"
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Maria Khan"
                className="border-line bg-surface-elevated text-ink focus:border-brand-500 focus:ring-brand-100 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-4"
              />
            </label>

            <label className="block">
              <span className="text-ink mb-1.5 block text-xs font-bold">
                Review Headline
              </span>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Wonderful texture and results!"
                className="border-line bg-surface-elevated text-ink focus:border-brand-500 focus:ring-brand-100 h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-4"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-ink mb-1.5 block text-xs font-bold">
              Review details *
            </span>
            <textarea
              required
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="What did you like or dislike about this product? How did it feel?"
              className="border-line bg-surface-elevated text-ink focus:border-brand-500 focus:ring-brand-100 w-full rounded-xl border p-3 text-sm outline-none focus:ring-4"
            />
          </label>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={buttonStyles({ variant: "primary", size: "sm", className: "font-bold" })}
            >
              Submit Review
            </button>
          </div>
        </form>
      ) : null}

      {/* Customer reviews list */}
      <div className="mt-10 space-y-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="border-line bg-surface-elevated/70 shadow-2xs rounded-2xl border p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-brand-100 text-brand-700 grid size-10 place-items-center rounded-full text-sm font-extrabold">
                  {review.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink text-sm font-bold">
                      {review.name}
                    </span>
                    {review.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3" /> Verified Buyer
                      </span>
                    ) : null}
                  </div>
                  <span className="text-ink-muted text-xs">{review.date}</span>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <h4 className="text-ink mt-3 text-sm font-bold sm:text-base">
              {review.title}
            </h4>
            <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
              {review.comment}
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs">
              <button
                type="button"
                className="text-ink-muted hover:text-ink flex items-center gap-1.5 font-medium transition-colors"
              >
                <ThumbsUp className="size-3.5" />
                <span>Helpful ({review.helpfulCount})</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
