import { api } from "@/lib/api";
import type {
  InstitutionCreate,
  InstitutionResponse,
  InstitutionType,
  InstitutionUpdate,
} from "@/types/institution";

export const institutionService = {
  /**
   * List institutions with optional type filtering. Authenticated endpoint.
   */
  listInstitutions(params?: {
    institution_type?: InstitutionType;
    active_only?: boolean;
  }): Promise<InstitutionResponse[]> {
    return api.get<InstitutionResponse[]>("/api/institutions", {
      params: {
        institution_type: params?.institution_type,
        active_only: params?.active_only,
      },
    });
  },

  /**
   * Get a single institution by ID. Authenticated endpoint.
   */
  getInstitution(id: number): Promise<InstitutionResponse> {
    return api.get<InstitutionResponse>(`/api/institutions/${id}`);
  },

  /**
   * Create an institution. Government role required by backend.
   */
  createInstitution(data: InstitutionCreate): Promise<InstitutionResponse> {
    return api.post<InstitutionResponse>("/api/institutions", data);
  },

  /**
   * Update an institution. Government role required by backend.
   */
  updateInstitution(id: number, data: InstitutionUpdate): Promise<InstitutionResponse> {
    return api.patch<InstitutionResponse>(`/api/institutions/${id}`, data);
  },

  /**
   * Deactivate an institution. Government role required by backend.
   */
  deleteInstitution(id: number): Promise<void> {
    return api.delete<void>(`/api/institutions/${id}`);
  },
};
