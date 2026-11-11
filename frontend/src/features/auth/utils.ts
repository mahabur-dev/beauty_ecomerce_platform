import type { Route } from "next";

const AUTH_LOOP_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const GUEST_ONLY_PATHS = new Set([...AUTH_LOOP_PATHS, "/verify-email"]);

function stripQueryAndHash(path: string): string {
  return path.split(/[?#]/, 1)[0] ?? path;
}

function isSafeInternalPath(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\"),
  );
}

/**
 * Resolves a safe in-app redirect target for post-authentication navigation.
 */
export function safeReturnPath(
  value: string | undefined,
  fallback: Route = "/account",
): Route {
  if (!isSafeInternalPath(value)) {
    return fallback;
  }

  if (AUTH_LOOP_PATHS.has(stripQueryAndHash(value))) {
    return fallback;
  }

  return value as Route;
}

/**
 * Builds an auth route URL that preserves a safe post-authentication `next` path.
 */
export function buildAuthHrefWithNext(
  target: "/login" | "/register" | "/verify-email",
  nextPath?: string | null,
): Route {
  if (!isSafeInternalPath(nextPath)) {
    return target;
  }

  if (AUTH_LOOP_PATHS.has(stripQueryAndHash(nextPath))) {
    return target;
  }

  return `${target}?next=${encodeURIComponent(nextPath)}` as Route;
}

/**
 * Builds the login URL for the current storefront location, preserving `next` on
 * auth routes and capturing the active page path + query string otherwise.
 */
export function buildLoginHrefForLocation(
  pathname: string,
  searchQuery = "",
  existingNext: string | null = null,
): Route {
  const cleanPathname = stripQueryAndHash(pathname);

  if (GUEST_ONLY_PATHS.has(cleanPathname)) {
    return buildAuthHrefWithNext("/login", existingNext);
  }

  const currentLocation = searchQuery ? `${pathname}?${searchQuery}` : pathname;

  if (!isSafeInternalPath(currentLocation)) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(currentLocation)}` as Route;
}

/**
 * Extracts a safe same-origin referrer path when explicit `next` query state is absent.
 */
export function resolveReferrerReturnPath(
  referrer: string | undefined,
  currentOrigin: string | undefined,
): string | undefined {
  if (!referrer || !currentOrigin) {
    return undefined;
  }

  try {
    const parsed = new URL(referrer);
    if (parsed.origin !== currentOrigin || GUEST_ONLY_PATHS.has(parsed.pathname)) {
      return undefined;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}
