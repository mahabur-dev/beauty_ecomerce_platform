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
