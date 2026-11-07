import { env } from "@/config/env";
import { ensureCsrfCookie, readCookie } from "@/lib/api/csrf";
import { ApiError, ApiNetworkError, ApiResponseError } from "@/lib/api/errors";
import type { ProblemDetails } from "@/types/api";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  json?: unknown;
  initializeCsrf?: boolean;
}

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function buildUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${env.apiBaseUrl.replace(/\/$/, "")}${normalized}`;
}

async function responseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (!response.ok) return text;
    throw new ApiResponseError(response.status, error);
  }
}

function problemDetails(response: Response, body: unknown): ProblemDetails {
  const retryAfterHeader = Number.parseInt(
    response.headers.get("Retry-After") ?? "",
    10,
  );
  const retryAfter = Number.isFinite(retryAfterHeader)
    ? Math.max(0, retryAfterHeader)
    : undefined;

  if (typeof body === "object" && body !== null && "title" in body) {
    const candidate = body as Partial<ProblemDetails>;
    if (typeof candidate.title === "string") {
      return {
        ...candidate,
        title: candidate.title,
        status: response.status,
        ...(candidate.retry_after === undefined && retryAfter !== undefined
          ? { retry_after: retryAfter }
          : {}),
      };
    }
  }

  // Laravel validation errors commonly use { message, errors } rather than RFC 9457.
  if (typeof body === "object" && body !== null) {
    const candidate = body as Record<string, unknown>;
    const message =
      typeof candidate.message === "string" ? candidate.message : undefined;
    const errors = candidate.errors;
    const validErrors =
      errors && typeof errors === "object" && !Array.isArray(errors)
        ? Object.fromEntries(
            Object.entries(errors).filter(
              (entry): entry is [string, string[]] =>
                Array.isArray(entry[1]) &&
                entry[1].every((item: unknown) => typeof item === "string"),
            ),
          )
        : undefined;
    return {
      title: message ?? response.statusText ?? "Request failed",
      status: response.status,
      ...(retryAfter !== undefined ? { retry_after: retryAfter } : {}),
      ...(validErrors ? { errors: validErrors } : {}),
    };
  }
  return {
    title: response.statusText || "Request failed",
    status: response.status,
    ...(retryAfter !== undefined ? { retry_after: retryAfter } : {}),
    ...(typeof body === "string" ? { detail: body } : {}),
  };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return executeRequest<T>(path, options, true, false);
}

async function executeRequest<T>(
  path: string,
  options: ApiRequestOptions,
  allowCsrfRetry: boolean,
  forceCsrfRefresh: boolean,
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const requiresCsrf =
    !safeMethods.has(method) && options.initializeCsrf !== false;
  if (requiresCsrf) await ensureCsrfCookie(forceCsrfRefresh);

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");

  if (options.json !== undefined)
    headers.set("Content-Type", "application/json");
  const csrfToken = requiresCsrf ? readCookie("XSRF-TOKEN") : undefined;
  if (csrfToken) headers.set("X-XSRF-TOKEN", csrfToken);

  const { body, initializeCsrf, json, ...requestOptions } = options;
  void initializeCsrf;
  const payload = json === undefined ? body : JSON.stringify(json);
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...requestOptions,
      method,
      credentials: requestOptions.credentials ?? "include",
      headers,
      ...(payload === undefined ? {} : { body: payload }),
    });
  } catch (error) {
    throw new ApiNetworkError(error);
  }

  const parsedBody = await responseBody(response);
  if (response.status === 419 && requiresCsrf && allowCsrfRetry) {
    return executeRequest<T>(path, options, false, true);
  }
  if (!response.ok) throw new ApiError(problemDetails(response, parsedBody));
  return parsedBody as T;
}
