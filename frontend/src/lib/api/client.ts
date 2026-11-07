import { env } from "@/config/env";
import {
  ApiError,
  ApiNetworkError,
  ApiResponseError,
} from "@/lib/api/api-error";
import type { ProblemDetails } from "@/types/api";

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  json?: unknown;
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${env.apiBaseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (text.length === 0) {
    return undefined;
  }

  if (contentType.includes("json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      if (!response.ok) {
        return text;
      }

      throw new ApiResponseError(response.status, error);
    }
  }

  return text;
}

function toProblemDetails(response: Response, body: unknown): ProblemDetails {
  if (typeof body === "object" && body !== null) {
    const candidate = body as Partial<ProblemDetails>;

    if (typeof candidate.title === "string") {
      return {
        ...candidate,
        title: candidate.title,
        status: response.status,
      };
    }
  }

  const detail = typeof body === "string" ? body : undefined;

  return {
    title: response.statusText || "Request failed",
    status: response.status,
    ...(detail === undefined ? {} : { detail }),
  };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    body: requestBody,
    json,
    headers: requestHeaders,
    ...requestOptions
  } = options;
  const headers = new Headers(requestHeaders);

  headers.set("Accept", "application/json");

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const requestPayload =
    json === undefined ? requestBody : JSON.stringify(json);
  const requestInit: RequestInit = {
    ...requestOptions,
    credentials: requestOptions.credentials ?? "include",
    headers,
    ...(requestPayload === undefined ? {} : { body: requestPayload }),
  };
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), requestInit);
  } catch (error) {
    throw new ApiNetworkError(error);
  }

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(toProblemDetails(response, responseBody));
  }

  return responseBody as T;
}
