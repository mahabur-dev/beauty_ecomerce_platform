"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { logoutAdmin } from "@/features/auth/api";
import { Icon } from "@/components/ui/icon";

export function LogoutButton() {
  const router = useRouter();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await logoutAdmin();
      client.clear();
      router.replace("/login");
    } catch {
      client.clear();
      setError(
        "Server logout could not be confirmed. Your session may remain active. Retry logout or close the browser.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="logout-control">
      <button
        className="logout-icon"
        type="button"
        disabled={busy}
        onClick={() => void logout()}
        aria-label={busy ? "Signing out" : "Sign out"}
        title="Sign out"
      >
        <Icon name="logout" size={18} />
      </button>
      {error && (
        <p className="logout-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
