import { apiRequest } from "@/lib/api";
import type { Team, TeamCreate, TeamUpdate } from "@/types/team";

const TEAM_BASE = "/api/teams";

export const teamService = {
  listTeams: () =>
    apiRequest<Team[]>(`${TEAM_BASE}/`),

  getTeam: (teamId: number) =>
    apiRequest<Team>(`${TEAM_BASE}/${teamId}`),

  createTeam: (data: TeamCreate) =>
    apiRequest<Team>(`${TEAM_BASE}/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTeam: (teamId: number, data: TeamUpdate) =>
    apiRequest<Team>(`${TEAM_BASE}/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTeam: (teamId: number) =>
    apiRequest<void>(`${TEAM_BASE}/${teamId}`, {
      method: "DELETE",
    }),
};