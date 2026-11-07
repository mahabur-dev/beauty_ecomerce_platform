import { apiErrorMessage } from "@/lib/api/errors";

export function catalogErrorMessage(error: unknown): string {
  return apiErrorMessage(error);
}
