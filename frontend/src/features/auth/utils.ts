import type { Route } from "next";

export function safeReturnPath(value: string | undefined): Route {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }

  return value as Route;
}
