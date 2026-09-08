import { api } from "@/lib/api";
import type {
  PassportUpdate,
  ReplicationResponse,
  SolutionPassportResponse,
} from "@/types/solution";

export const solutionService = {
  /**
   * Generate a passport draft from a completed project. University role.
   */
  generatePassport(projectId: number): Promise<SolutionPassportResponse> {
    return api.post<SolutionPassportResponse>("/api/solutions/passports", {
      project_id: projectId,
    });
  },

  /**
   * Return all solution passports. Authenticated.
   */
  listPassports(): Promise<SolutionPassportResponse[]> {
    return api.get<SolutionPassportResponse[]>("/api/solutions/passports");
  },

  /**
   * Return one solution passport. Authenticated.
   */
  getPassport(id: number): Promise<SolutionPassportResponse> {
    return api.get<SolutionPassportResponse>(`/api/solutions/passports/${id}`);
  },

  /**
   * Edit a passport's guidance fields. University role.
   */
  updatePassport(id: number, data: PassportUpdate): Promise<SolutionPassportResponse> {
    return api.patch<SolutionPassportResponse>(`/api/solutions/passports/${id}`, data);
  },

  /**
   * Publish a passport so it can feed replication matching. University role.
   */
  publishPassport(id: number): Promise<SolutionPassportResponse> {
    return api.post<SolutionPassportResponse>(`/api/solutions/passports/${id}/publish`);
  },

  /**
   * Score published passports against a challenge (replication). Authenticated.
   */
  similarForChallenge(challengeId: number): Promise<ReplicationResponse> {
    return api.get<ReplicationResponse>(
      `/api/solutions/similar?challenge_id=${challengeId}`,
    );
  },
};