import { api } from "@/lib/api";
import type { AnalyticsOverview } from "@/types/analytics";

export const analyticsService = {
  /**
   * Return high-level platform analytics overview. Authenticated endpoint.
   */
  getOverview(): Promise<AnalyticsOverview> {
    return api.get<AnalyticsOverview>("/api/analytics/overview");
  },
};
