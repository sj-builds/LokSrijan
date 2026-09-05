import { api } from "@/lib/api";
import type { ImpactCreate, ImpactResponse, ImpactUpdate } from "@/types/impact";

export const impactService = {
  /**
   * Record measurable impact for a project. Authenticated endpoint.
   */
  createImpact(data: ImpactCreate): Promise<ImpactResponse> {
    return api.post<ImpactResponse>("/api/impact", data);
  },

  /**
   * Get recorded impact for a project. Authenticated endpoint.
   */
  getImpact(projectId: number): Promise<ImpactResponse> {
    return api.get<ImpactResponse>(`/api/impact/${projectId}`);
  },

  /**
   * Update existing impact record for a project. Authenticated endpoint.
   */
  updateImpact(projectId: number, data: ImpactUpdate): Promise<ImpactResponse> {
    return api.patch<ImpactResponse>(`/api/impact/${projectId}`, data);
  },
};
