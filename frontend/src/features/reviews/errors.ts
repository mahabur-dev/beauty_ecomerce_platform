import { ApiError, ApiNetworkError } from "@/lib/api/api-error";

import type { ReviewFieldErrors } from "./schemas";

export function extractReviewFieldErrors(error: unknown): ReviewFieldErrors {
  if (!(error instanceof ApiError) || !error.problem.errors) {
    return {};
  }

  const errors = error.problem.errors;
  return {
    rating: errors.rating?.[0],
    body: errors.body?.[0],
  };
}

export function isVersionConflictError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return false;
  }

  const title = error.problem.title.toLowerCase();
  const detail = (error.problem.detail ?? "").toLowerCase();

  return title.includes("version conflict") || detail.includes("concurrently");
}

export function isDuplicateReviewError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return false;
  }

  const title = error.problem.title.toLowerCase();
  const detail = (error.problem.detail ?? "").toLowerCase();

  return (
    title.includes("duplicate") || detail.includes("already submitted")
  );
}

export function getReviewErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Please sign in to manage your product review.";
    }

    if (error.status === 403) {
      return (
        error.problem.detail ??
        "You must verify your email address before managing reviews."
      );
    }

    if (error.status === 419) {
      return "Your secure session expired. Please refresh and try again.";
    }

    if (error.status === 429) {
      return "Too many review requests right now. Please wait a moment and try again.";
    }

    return error.problem.detail ?? error.problem.title;
  }

  if (error instanceof ApiNetworkError) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

