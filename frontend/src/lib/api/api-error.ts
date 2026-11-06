import type { ProblemDetails } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.problem = problem;
  }
}

export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super("The API could not be reached.", { cause });
    this.name = "ApiNetworkError";
  }
}

export class ApiResponseError extends Error {
  readonly status: number;

  constructor(status: number, cause: unknown) {
    super("The API returned an invalid JSON response.", { cause });
    this.name = "ApiResponseError";
    this.status = status;
  }
}
