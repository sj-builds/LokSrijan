/**
 * Institution types — aligned with backend app/schemas/institution.py
 */

export type InstitutionType = "UNIVERSITY" | "NGO" | "INDUSTRY";

export interface InstitutionCreate {
  name: string;
  institution_type: InstitutionType;
  description: string;
  location: string;
  capabilities: string;
  website?: string | null;
  contact_email?: string | null;
}

export interface InstitutionUpdate {
  name?: string | null;
  description?: string | null;
  location?: string | null;
  capabilities?: string | null;
  website?: string | null;
  contact_email?: string | null;
  is_active?: boolean | null;
}

export interface InstitutionResponse {
  id: number;
  name: string;
  institution_type: InstitutionType;
  description: string;
  location: string;
  capabilities: string;
  website: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}
