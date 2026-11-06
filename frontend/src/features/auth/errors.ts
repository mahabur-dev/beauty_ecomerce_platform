import { ApiError, ApiNetworkError } from "@/lib/api/api-error";

import type { AuthFieldErrors } from "./schemas";

export function authFieldErrors(error: unknown): AuthFieldErrors {
  if (!(error instanceof ApiError) || !error.problem.errors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.problem.errors).map(([field, messages]) => [
      field,
      messages[0],
    ]),
  );
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 419) {
      return "Your secure session expired. Please try again.";
    }

    if (error.status === 429) {
      return "Too many attempts. Please wait a minute and try again.";
    }

    return error.problem.detail ?? error.problem.title;
  }

  if (error instanceof ApiNetworkError) {
    return "We could not reach the server. Check your connection and try again.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
