import type { ProblemDetails } from "@/types/api";

export class ApiError extends Error {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.problem = problem;
  }
}

export class ApiNetworkError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("The API could not be reached.");
    this.name = "ApiNetworkError";
    this.cause = cause;
  }
}

export class ApiResponseError extends Error {
  readonly status: number;
  readonly cause: unknown;

  constructor(status: number, cause: unknown) {
    super("The API returned an unreadable response.");
    this.name = "ApiResponseError";
    this.status = status;
    this.cause = cause;
  }
}

export class ApiContractError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("The API returned an unexpected response.");
    this.name = "ApiContractError";
    this.cause = cause;
  }
}

export function apiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) {
    const validation = error.problem.errors
      ? Object.values(error.problem.errors).flat()[0]
      : undefined;
    if (validation) return validation;

    if (error.problem.status === 429) {
      const retryAfter = error.problem.retry_after;
      return retryAfter !== undefined
        ? `Too many requests. Please try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`
        : "Too many requests. Please wait a moment and try again.";
    }

    return error.problem.detail ?? error.problem.title;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
