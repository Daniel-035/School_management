import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

export const queryKeys = {
  users: (role?: string) => ["users", role ?? "all"] as const,
  students: ["students"] as const,
  classes: ["classes"] as const,
  subjects: ["subjects"] as const,
  announcements: ["announcements"] as const,
  events: ["events"] as const,
  feePayments: ["fees", "payments"] as const,
  feeStructures: ["fees", "structures"] as const,
  feeSummary: ["fees", "summary"] as const,
};
