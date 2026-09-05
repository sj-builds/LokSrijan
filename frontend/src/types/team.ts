export type TeamStatus =
  | "FORMING"
  | "ACTIVE"
  | "COMPLETED"
  | "PAUSED";

export interface Team {
  id: number;
  code: string;
  name: string;
  department: string;
  mentor: string;
  members: number;
  challenge_id: number | null;
  created_by: number;
  status: string;
  progress: number;
  last_update: string;
  created_at: string;
  updated_at: string;
}

export interface TeamCreate {
  name: string;
  department: string;
  mentor?: string;
  members?: number;
  challenge_id?: number | null;
}

export interface TeamUpdate {
  name?: string;
  department?: string;
  mentor?: string;
  members?: number;
  challenge_id?: number | null;
  status?: string;
  progress?: number;
  last_update?: string;
}