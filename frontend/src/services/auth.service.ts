import { api } from "@/lib/api";
import type { AuthResponse, UserLogin, UserRegister, UserResponse } from "@/types/auth";

export const authService = {
  /**
   * Registers a new user. Backend defaults role to "citizen".
   */
  register(data: UserRegister): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/register", data, { skipAuth: true });
  },

  /**
   * Authenticates user and returns JWT token + user profile.
   */
  login(data: UserLogin): Promise<AuthResponse> {
    return api.post<AuthResponse>("/api/auth/login", data, { skipAuth: true });
  },

  /**
   * Retrieves the currently authenticated user based on the Bearer token.
   */
  getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>("/api/auth/me");
  },
};
