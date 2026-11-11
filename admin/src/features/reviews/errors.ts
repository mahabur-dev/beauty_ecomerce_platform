import { ApiError, apiErrorMessage } from "@/lib/api/errors";

export function reviewErrorMessage(error: unknown): string {
  return apiErrorMessage(error);
}

export function isReviewConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 409;
}

export function isReviewPermissionError(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 403;
}

export function extractReviewFieldError(
  error: unknown,
  field: string,
): string | undefined {
  if (!(error instanceof ApiError) || !error.problem.errors) {
    return undefined;
  }

  return error.problem.errors[field]?.[0];
}

