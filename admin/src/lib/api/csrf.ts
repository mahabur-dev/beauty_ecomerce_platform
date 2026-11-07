import { env } from "@/config/env";
import { ApiNetworkError } from "@/lib/api/errors";

let csrfRequest: Promise<void> | undefined;

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

export function resetCsrfState(): void {
  csrfRequest = undefined;
}

export function clearCsrfCookie(): void {
  resetCsrfState();
  if (typeof document !== "undefined") {
    document.cookie = "XSRF-TOKEN=; Max-Age=0; Path=/; SameSite=Lax";
  }
}

export async function ensureCsrfCookie(forceRefresh = false): Promise<void> {
  if (!forceRefresh && readCookie("XSRF-TOKEN")) return;

  csrfRequest ??= (async () => {
    try {
      const response = await fetch(
        `${env.apiOrigin.replace(/\/$/, "")}/sanctum/csrf-cookie`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`CSRF initialization failed with ${response.status}`);
      }
    } catch (error) {
      throw new ApiNetworkError(error);
    } finally {
      // Deduplicate only concurrent requests. If the browser later expires the
      // cookie, the next mutation must be able to initialize CSRF again.
      resetCsrfState();
    }
  })();

  return csrfRequest;
}
