import { api } from "@/lib/api";
import type {
  ProjectCreate,
  ProjectResponse,
  ProjectStatus,
  ProjectStatusUpdate,
  ProjectUpdate,
} from "@/types/project";

export const projectService = {
  /**
   * Return all projects. Public endpoint.
   */
  listProjects(): Promise<ProjectResponse[]> {
    return api.get<ProjectResponse[]>("/api/projects/");
  },

  /**
   * Return a project by ID. Public endpoint.
   */
  getProject(id: number): Promise<ProjectResponse> {
    return api.get<ProjectResponse>(`/api/projects/${id}`);
  },

  /**
   * Return all projects for a challenge. Public endpoint.
   */
  getProjectsByChallenge(challengeId: number): Promise<ProjectResponse[]> {
    return api.get<ProjectResponse[]>(`/api/projects/challenge/${challengeId}`);
  },

  /**
   * Create a solution project for a validated challenge.
   * Citizen, university, ngo, and industry roles supported by backend.
   */
  createProject(data: ProjectCreate): Promise<ProjectResponse> {
    return api.post<ProjectResponse>("/api/projects/", data);
  },

  /**
   * Update an existing draft project. Creator only.
   */
  updateProject(id: number, data: ProjectUpdate): Promise<ProjectResponse> {
    return api.put<ProjectResponse>(`/api/projects/${id}`, data);
  },

  /**
   * Delete an existing draft project. Creator only.
   */
  deleteProject(id: number): Promise<void> {
    return api.delete<void>(`/api/projects/${id}`);
  },

  /**
   * Update project lifecycle status.
   * Creator transitions: DRAFT->SUBMITTED, APPROVED->IN_PROGRESS, IN_PROGRESS->COMPLETED
   * Government transitions: SUBMITTED->UNDER_REVIEW, UNDER_REVIEW->APPROVED/REJECTED
   */
  updateProjectStatus(id: number, new_status: ProjectStatus): Promise<ProjectResponse> {
    const payload: ProjectStatusUpdate = { new_status };
    return api.patch<ProjectResponse>(`/api/projects/${id}/status`, payload);
  },
};
