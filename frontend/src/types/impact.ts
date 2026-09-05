/**
 * Impact types — aligned with backend app/schemas/impact.py
 */

export interface ImpactCreate {
  project_id: number;
  beneficiaries?: number;
  outcome: string;
  impact_score?: number; // 0 to 100
  evidence?: string | null;
}

export interface ImpactUpdate {
  beneficiaries?: number | null;
  outcome?: string | null;
  impact_score?: number | null;
  evidence?: string | null;
}

export interface ImpactResponse {
  id: number;
  project_id: number;
  beneficiaries: number;
  outcome: string;
  impact_score: number;
  evidence: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}
