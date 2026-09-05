/**
 * Project types — aligned with backend app/schemas/project.py
 */

export type ProjectStatus =
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";

/** ProjectResponse — returned by GET /api/projects/ and GET /api/projects/{id} */
export interface ProjectResponse {
  id: number;
  title: string;
  description: string;
  solution_summary: string;
  category: string;
  challenge_id: number;
  created_by: number;
  status: ProjectStatus;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

/** ProjectCreate — body for POST /api/projects/ (citizen/university/ngo/industry) */
export interface ProjectCreate {
  title: string;
  description: string;
  solution_summary: string;
  category: string;
  challenge_id: number;
}

/** ProjectUpdate — body for PUT /api/projects/{id} (owner, DRAFT only) */
export interface ProjectUpdate {
  title?: string;
  description?: string;
  solution_summary?: string;
  category?: string;
}

/** ProjectStatusUpdate — body for PATCH /api/projects/{id}/status */
export interface ProjectStatusUpdate {
  new_status: ProjectStatus;
}

/**
 * Valid project state machine transitions (mirrors backend state_machine.py).
 * Creator transitions: DRAFT→SUBMITTED, APPROVED→IN_PROGRESS, IN_PROGRESS→COMPLETED
 * Government transitions: SUBMITTED→UNDER_REVIEW, UNDER_REVIEW→APPROVED/REJECTED
 */
export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

/** Human-readable labels for project statuses */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};
