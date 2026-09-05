import { api } from "@/lib/api";
import type {
  ChallengeCreate,
  ChallengeResponse,
  ChallengeStatus,
  ChallengeStatusUpdate,
  ChallengeUpdate,
} from "@/types/challenge";

export const challengeService = {
  /**
   * Return all challenges. Public endpoint.
   */
  listChallenges(): Promise<ChallengeResponse[]> {
    return api.get<ChallengeResponse[]>("/api/challenges/");
  },

  /**
   * Return a challenge by ID. Public endpoint.
   */
  getChallenge(id: number): Promise<ChallengeResponse> {
    return api.get<ChallengeResponse>(`/api/challenges/${id}`);
  },

  /**
   * Create a new challenge. Government role required by backend.
   */
  createChallenge(data: ChallengeCreate): Promise<ChallengeResponse> {
    return api.post<ChallengeResponse>("/api/challenges/", data);
  },

  /**
   * Update an existing challenge. Creator only.
   */
  updateChallenge(id: number, data: ChallengeUpdate): Promise<ChallengeResponse> {
    return api.put<ChallengeResponse>(`/api/challenges/${id}`, data);
  },

  /**
   * Delete an existing challenge. Creator only.
   */
  deleteChallenge(id: number): Promise<void> {
    return api.delete<void>(`/api/challenges/${id}`);
  },

  /**
   * Update lifecycle status of a challenge. Government role required by backend.
   */
  updateChallengeStatus(id: number, new_status: ChallengeStatus): Promise<ChallengeResponse> {
    const payload: ChallengeStatusUpdate = { new_status };
    return api.patch<ChallengeResponse>(`/api/challenges/${id}/status`, payload);
  },
};
