import { isServer, QueryClient } from "@tanstack/react-query";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.name === "ApiError") return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return createQueryClient();
  browserClient ??= createQueryClient();
  return browserClient;
}
