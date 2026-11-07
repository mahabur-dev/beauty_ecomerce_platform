import { queryOptions } from "@tanstack/react-query";

import { getCurrentAdmin } from "@/features/auth/api";

export const currentAdminQuery = queryOptions({
  queryKey: ["admin", "session"] as const,
  queryFn: getCurrentAdmin,
  staleTime: 0,
  refetchOnWindowFocus: true,
  retry: false,
});
