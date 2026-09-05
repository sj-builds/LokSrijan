import { useEffect, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { BackendRole, UserResponse } from "@/types/auth";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/lib/api";

const KEY = "loksrijan.session";

export interface Session {
  id: number;
  name: string;
  email: string;
  role: BackendRole;
  token: string;
  identifier?: string;
}

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.token || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(s: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("loksrijan-session"));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("loksrijan-session"));
}

export function getAuthToken(): string | null {
  const session = readSession();
  return session?.token || null;
}

export function logout(queryClient?: QueryClient) {
  clearSession();
  if (queryClient) {
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
  }
}

/**
 * Basic reactive hook for reading session from localStorage.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(() => readSession());

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener("loksrijan-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("loksrijan-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return session;
}

/**
 * Authoritative authentication hook.
 * Reconciles local session with GET /api/auth/me from backend.
 * Handles loading, unauthorized 401 clearing, and role derivation.
 */
export function useAuth() {
  const session = useSession();
  const token = session?.token || null;
  const queryClient = useQueryClient();

  const userQuery = useQuery<UserResponse, Error>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const user = await authService.getCurrentUser();
        // Sync local storage if authoritative user details differ
        const current = readSession();
        if (
          current &&
          (current.id !== user.id ||
            current.name !== user.name ||
            current.email !== user.email ||
            current.role !== user.role)
        ) {
          writeSession({
            ...current,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          });
        }
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          queryClient.setQueryData(AUTH_QUERY_KEY, null);
        }
        throw err;
      }
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: (count, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return count < 2;
    },
  });

  const isAuthenticated = Boolean(token && (userQuery.data || session));
  const effectiveRole = userQuery.data?.role ?? session?.role ?? null;
  const effectiveName = userQuery.data?.name ?? session?.name ?? "";
  const effectiveEmail = userQuery.data?.email ?? session?.email ?? "";
  const effectiveId = userQuery.data?.id ?? session?.id ?? null;

  return {
    session,
    user: userQuery.data ?? null,
    isAuthenticated,
    role: effectiveRole,
    name: effectiveName,
    email: effectiveEmail,
    id: effectiveId,
    isLoading: Boolean(token) && userQuery.isLoading,
    isError: userQuery.isError,
    error: userQuery.error,
    refetch: userQuery.refetch,
  };
}
