/**
 * AI Problem Intelligence types — aligned with backend app/schemas/intelligence.py
 */

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProblemAnalysisRequest {
  description: string;
}

export interface ProblemAnalysisResponse {
  domain: string;
  subdomain: string;
  problem: string;
  severity: SeverityLevel;
  urgency: SeverityLevel;
  affected_population: string;
  keywords: string[];
  required_capabilities: string[];
  potential_causes: string[];
  confidence: number;
  reason: string;
  human_verification_required: boolean;
}

export interface SimilarityRequest {
  text_a: string;
  text_b: string;
}

export interface SimilarityResponse {
  similarity_score: number;
  is_possible_duplicate: boolean;
}

export interface DuplicateChallenge {
  challenge_id: number;
  title: string;
  similarity_score: number;
}

export interface ChallengeIntelligenceResponse {
  challenge_id: number;
  analysis: ProblemAnalysisResponse;
  possible_duplicates: DuplicateChallenge[];
  duplicate_count: number;
}
