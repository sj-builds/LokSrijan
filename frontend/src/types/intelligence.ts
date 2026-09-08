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
  /** Human-readable evidence signals, e.g. "same domain", "nearby location". */
  signals: string[];
  /** HIGH / MEDIUM / LOW — honest confidence label. */
  confidence_label: string;
  category_match: boolean;
  location_match: boolean;
}

export interface ChallengeIntelligenceResponse {
  challenge_id: number;
  analysis: ProblemAnalysisResponse;
  possible_duplicates: DuplicateChallenge[];
  duplicate_count: number;
}

export interface PriorityFactor {
  label: string;
  detail: string;
  weight: number;
}

export interface PriorityResponse {
  challenge_id: number;
  priority_score: number;
  priority_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: PriorityFactor[];
  methodology_note: string;
}

export interface ChallengePrioritySummary {
  challenge_id: number;
  title: string;
  location: string;
  severity: SeverityLevel;
  status: string;
  priority_score: number;
  priority_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  top_factors: string[];
}
