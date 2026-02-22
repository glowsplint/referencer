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

export type AuthProvider = "google" | "apple" | "facebook";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
  if (!res.ok) return { authenticated: false };
  return res.json();
}

export function loginWith(provider: AuthProvider): void {
  window.location.href = `${API_URL}/auth/${provider}`;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
}
