import { api } from "@/lib/api";
import type { ChallengeMatchingResponse } from "@/types/matching";

export const matchingService = {
  /**
   * Find institutions that match a challenge's required capabilities.
   * Authenticated endpoint.
   */
  matchInstitutions(challengeId: number): Promise<ChallengeMatchingResponse> {
    return api.post<ChallengeMatchingResponse>(`/api/institutions/match/${challengeId}`);
  },
};
