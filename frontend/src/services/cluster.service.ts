import { api } from "@/lib/api";
import type {
  ClusterCreate,
  ClusterResponse,
  ClusterSuggestResponse,
} from "@/types/cluster";

export const clusterService = {
  /**
   * Suggest candidate clusters from current citizen reports. Authenticated.
   */
  suggestClusters(): Promise<ClusterSuggestResponse> {
    return api.post<ClusterSuggestResponse>("/api/clusters/suggest");
  },

  /**
   * List all challenge clusters. Authenticated.
   */
  listClusters(): Promise<ClusterResponse[]> {
    return api.get<ClusterResponse[]>("/api/clusters/");
  },

  /**
   * Get one cluster with member reports. Authenticated.
   */
  getCluster(id: number): Promise<ClusterResponse> {
    return api.get<ClusterResponse>(`/api/clusters/${id}`);
  },

  /**
   * Create a cluster from selected reports. Government only.
   */
  createCluster(data: ClusterCreate): Promise<ClusterResponse> {
    return api.post<ClusterResponse>("/api/clusters/", data);
  },

  /**
   * Mark a suggested cluster as validated. Government only.
   */
  validateCluster(id: number): Promise<ClusterResponse> {
    return api.patch<ClusterResponse>(`/api/clusters/${id}/validate`);
  },

  /**
   * Reject a suggested cluster. Government only.
   */
  rejectCluster(id: number): Promise<ClusterResponse> {
    return api.patch<ClusterResponse>(`/api/clusters/${id}/reject`);
  },
};