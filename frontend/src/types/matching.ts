/**
 * Institution matching types — aligned with backend app/schemas/matching.py
 */

export interface InstitutionMatch {
  institution_id: number;
  institution_name: string;
  institution_type: string;
  location: string;
  matched_capabilities: string[];
  match_score: number; // 0 to 100
}

export interface ChallengeMatchingResponse {
  challenge_id: number;
  challenge_title: string;
  required_capabilities: string[];
  matches: InstitutionMatch[];
}
