/**
 * Impact types — aligned with backend app/schemas/impact.py
 *
 * The Impact Ledger tracks Baseline -> Target -> Actual -> Evidence ->
 * Verification. `improvement_pct` is computed server-side from baseline
 * and actual; clients never send it.
 */

export type VerificationStatus = "PENDING" | "VERIFIED";

export interface ImpactCreate {
  project_id: number;
  beneficiaries?: number;
  outcome: string;
  impact_score?: number; // 0 to 100
  evidence?: string | null;
  // Impact Ledger
  metric_name?: string | null;
  baseline_value?: number | null;
  target_value?: number | null;
  actual_value?: number | null;
  unit?: string | null;
  improvement_direction?: "down" | "up" | null;
}

export interface ImpactUpdate {
  beneficiaries?: number | null;
  outcome?: string | null;
  impact_score?: number | null;
  evidence?: string | null;
  // Impact Ledger
  metric_name?: string | null;
  baseline_value?: number | null;
  target_value?: number | null;
  actual_value?: number | null;
  unit?: string | null;
  improvement_direction?: "down" | "up" | null;
  verification_note?: string | null;
}

export interface ImpactVerify {
  verification_note: string;
  verified?: boolean;
}

export interface ImpactResponse {
  id: number;
  project_id: number;
  beneficiaries: number;
  outcome: string;
  impact_score: number;
  evidence: string | null;
  // Impact Ledger
  metric_name: string | null;
  baseline_value: number | null;
  target_value: number | null;
  actual_value: number | null;
  unit: string | null;
  improvement_direction: string | null;
  improvement_pct: number | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}