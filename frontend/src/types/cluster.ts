/**
 * Challenge cluster types — aligned with backend app/schemas/cluster.py
 */

export type ClusterStatus = "SUGGESTED" | "VALIDATED" | "REJECTED";

export interface ClusterMemberOut {
  challenge_id: number;
  title: string;
  location: string;
  category: string;
  severity: string;
  status: string;
  similarity_score: number | null;
}

export interface ClusterResponse {
  id: number;
  code: string;
  title: string;
  description: string;
  status: ClusterStatus;
  rationale: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  members: ClusterMemberOut[];
}

export interface ClusterCreate {
  title: string;
  description: string;
  rationale: string;
  challenge_ids: number[];
}

export interface SuggestedCluster {
  title: string;
  code: string;
  description: string;
  rationale: string;
  member_count: number;
  locations: string[];
  categories: string[];
  average_similarity: number;
  member_challenge_ids: number[];
  member_titles: string[];
}

export interface ClusterSuggestResponse {
  suggested_clusters: SuggestedCluster[];
  methodology_note: string;
}