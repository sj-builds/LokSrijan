/**
 * Auth types — aligned with backend app/schemas/auth.py
 */

/** Backend role values — exactly as the backend defines them. */
export type BackendRole = "citizen" | "government" | "university" | "ngo" | "industry";

/** UserResponse schema */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  is_active: boolean;
  created_at: string; // ISO datetime
}

/** TokenResponse schema */
export interface TokenResponse {
  access_token: string;
  token_type: string; // "bearer"
}

/** AuthResponse schema — returned by both /register and /login */
export interface AuthResponse {
  user: UserResponse;
  token: TokenResponse;
}

/** UserRegister request body */
export interface UserRegister {
  name: string;
  email: string;
  password: string;
}

/** UserLogin request body */
export interface UserLogin {
  email: string;
  password: string;
}
