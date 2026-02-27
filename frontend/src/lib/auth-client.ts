import { apiFetch, apiUrl } from "@/lib/api-client";

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
  await apiFetch("/auth/logout", { method: "POST" });

  // Clear offline Yjs caches so stale data doesn't leak across accounts
  if (typeof indexedDB !== "undefined" && indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name?.startsWith("referencer-yjs-")) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch {
      // Best-effort cleanup — indexedDB.databases() may not be supported
    }
  }
}
