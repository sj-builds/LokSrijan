import { api } from "@/lib/api";
import type {
  ChallengeIntelligenceResponse,
  ChallengePrioritySummary,
  PriorityResponse,
  ProblemAnalysisResponse,
  SimilarityResponse,
} from "@/types/intelligence";

export const intelligenceService = {
  /**
   * Analyze an unsubmitted or raw problem description using AI. Authenticated endpoint.
   */
  analyzeProblem(description: string): Promise<ProblemAnalysisResponse> {
    return api.post<ProblemAnalysisResponse>("/api/intelligence/analyze", {
      description,
    });
  },

  /**
   * Analyze an existing challenge and detect duplicates. Authenticated endpoint.
   */
  analyzeChallenge(challengeId: number): Promise<ChallengeIntelligenceResponse> {
    return api.post<ChallengeIntelligenceResponse>(
      `/api/intelligence/challenges/${challengeId}/analyze`,
    );
  },

  /**
   * Compare two problem descriptions for semantic similarity. Authenticated endpoint.
   */
  calculateSimilarity(text_a: string, text_b: string): Promise<SimilarityResponse> {
    return api.post<SimilarityResponse>("/api/intelligence/similarity", {
      text_a,
      text_b,
    });
  },

  /**
   * Explainable priority score for one challenge. Authenticated endpoint.
   */
  getPriority(challengeId: number): Promise<PriorityResponse> {
    return api.post<PriorityResponse>(
      `/api/intelligence/challenges/${challengeId}/priority`,
    );
  },

  /**
   * Priority summaries for every challenge (government dashboard). Authenticated endpoint.
   */
  listPriorities(): Promise<ChallengePrioritySummary[]> {
    return api.get<ChallengePrioritySummary[]>("/api/intelligence/priorities");
  },
};
