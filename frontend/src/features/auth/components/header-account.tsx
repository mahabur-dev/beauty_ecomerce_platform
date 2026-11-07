"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui";

import { useCurrentUser } from "../hooks";

export function HeaderAccount() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  if (user) {
    return (
      <Link
        href="/account"
        aria-label={`Account for ${user.name}`}
        title={user.name}
        className="bg-brand-100 text-brand-800 hover:bg-brand-200 focus-visible:outline-brand-600 hidden size-11 place-items-center rounded-full text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 sm:grid"
      >
        {user.name.trim().charAt(0).toUpperCase() || "A"}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      aria-label="Sign in"
      className={buttonStyles({
        variant: "ghost",
        size: "icon",
        className: "hidden sm:inline-flex",
      })}
    >
      <UserRound className="size-5" aria-hidden="true" />
    </Link>
  );
}
