import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/config/env";

import type { AuthUser, AuthUserResponse } from "./types";

export async function getServerCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${env.apiBaseUrl}/auth/me`, {
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
      Origin: env.appUrl,
      "X-Requested-With": "XMLHttpRequest",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to validate the customer session.");
  }

  const body = (await response.json()) as AuthUserResponse;

  return body.data;
}

export async function requireServerUser(
  returnTo = "/account",
): Promise<AuthUser> {
  const user = await getServerCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  return user;
}
