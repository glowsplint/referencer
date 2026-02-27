import { apiFetch, apiPost, apiUrl } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: AuthUser;
}

export type AuthProvider = "google" | "github";

export async function fetchAuthStatus(): Promise<AuthStatus> {
  try {
    return await apiFetch<AuthStatus>("/auth/me");
  } catch {
    return { authenticated: false };
  }
}

export function loginWith(provider: AuthProvider): void {
  window.location.href = apiUrl(`/auth/${provider}`);
}

export async function logout(): Promise<void> {
  await apiPost("/auth/logout");
}
