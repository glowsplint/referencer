export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string
}

export interface AuthStatus {
  authenticated: boolean
  user?: AuthUser
}

export type AuthProvider = "google" | "apple" | "facebook"

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch("/auth/me")
  if (!res.ok) return { authenticated: false }
  return res.json()
}

export function loginWith(provider: AuthProvider): void {
  window.location.href = `/auth/${provider}`
}

export async function logout(): Promise<void> {
  await fetch("/auth/logout", { method: "POST" })
}
