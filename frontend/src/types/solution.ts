/**
 * Solution passport types — aligned with backend app/schemas/solution.py
 *
 * A passport distills a completed project + impact ledger into a reusable
 * solution. Only PUBLISHED passports feed replication matching.
 */

export type PassportStatus = "DRAFT" | "PUBLISHED";

export interface SolutionPassportResponse {
  id: number;
  project_id: number;
  challenge_id: number;
  title: string;
  category: string;
  location: string;

  problem: string;
  root_cause: string | null;
  solution: string;
  technology: string | null;
  cost_estimate: string | null;
  implementation_time: string | null;
  required_skills: string | null;
  infrastructure: string | null;
  pilot_conditions: string | null;

  metric_name: string | null;
  baseline_value: number | null;
  actual_value: number | null;
  unit: string | null;
  improvement_pct: number | null;
  evidence: string | null;

  impact_verification_status: string;
  impact_verification_note: string | null;

  limitations: string | null;
  failure_conditions: string | null;
  replication_suitability: string | null;

  status: PassportStatus;
  created_by: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PassportUpdate {
  title?: string | null;
  root_cause?: string | null;
  solution?: string | null;
  technology?: string | null;
  cost_estimate?: string | null;
  implementation_time?: string | null;
  required_skills?: string | null;
  infrastructure?: string | null;
  pilot_conditions?: string | null;
  limitations?: string | null;
  failure_conditions?: string | null;
  replication_suitability?: string | null;
}

export interface ReplicationMatch {
  passport_id: number;
  passport_title: string;
  project_title: string;
  challenge_title: string;
  match_score: number;
  reasons: string[];
  impact_verification_status: string;
}

export interface ReplicationResponse {
  challenge_id: number;
  challenge_title: string;
  matches: ReplicationMatch[];
  methodology_note: string;
}