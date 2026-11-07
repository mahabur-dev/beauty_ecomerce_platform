"use client";

import { useQuery } from "@tanstack/react-query";
import { currentAdminQuery } from "@/features/auth/query-options";

export function useAdmin() {
  return useQuery(currentAdminQuery);
}
