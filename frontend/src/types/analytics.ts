/**
 * Analytics types — aligned with backend app/schemas/analytics.py
 */

export interface AnalyticsOverview {
  total_users: number;
  total_challenges: number;
  validated_challenges: number;
  total_projects: number;
  completed_projects: number;
  total_institutions: number;
  universities: number;
  ngos: number;
  industries: number;
  total_beneficiaries: number;
  average_impact_score: number;
}
