/**
 * Challenge types — aligned with backend app/schemas/challenge.py
 */

export type ChallengeSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ChallengeStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VALIDATED"
  | "REJECTED"
  | "TEAM_FORMED"
  | "IN_PROGRESS"
  | "SOLUTION_PROPOSED"
  | "IMPLEMENTED"
  | "RESOLVED";

/** ChallengeResponse — returned by GET /api/challenges/ and GET /api/challenges/{id} */
export interface ChallengeResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  severity: ChallengeSeverity;
  /** Reported urgency; null for records created before the field existed. */
  urgency: ChallengeSeverity | null;
  status: ChallengeStatus;
  created_by: number;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  /** True for records from the seeded demo dataset. */
  is_demo?: boolean;
}

/** ChallengeCreate — body for POST /api/challenges/ (government only) */
export interface ChallengeCreate {
  title: string;
  description: string;
  category: string;
  location: string;
  severity?: ChallengeSeverity;
  urgency?: ChallengeSeverity | null;
}

/** ChallengeUpdate — body for PUT /api/challenges/{id} */
export interface ChallengeUpdate {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  severity?: ChallengeSeverity;
  urgency?: ChallengeSeverity | null;
}

/** ChallengeStatusUpdate — body for PATCH /api/challenges/{id}/status (government only) */
export interface ChallengeStatusUpdate {
  new_status: ChallengeStatus;
}

/**
 * Valid challenge state machine transitions (mirrors backend state_machine.py).
 * Used to render only the allowed next-state buttons in the UI.
 */
export const CHALLENGE_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["VALIDATED", "REJECTED"],
  VALIDATED: ["TEAM_FORMED"],
  TEAM_FORMED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SOLUTION_PROPOSED"],
  SOLUTION_PROPOSED: ["IMPLEMENTED"],
  IMPLEMENTED: ["RESOLVED"],
  REJECTED: [],
  RESOLVED: [],
};

/** Human-readable labels for challenge statuses */
export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VALIDATED: "Validated",
  REJECTED: "Rejected",
  TEAM_FORMED: "Team Formed",
  IN_PROGRESS: "In Progress",
  SOLUTION_PROPOSED: "Solution Proposed",
  IMPLEMENTED: "Implemented",
  RESOLVED: "Resolved",
};
