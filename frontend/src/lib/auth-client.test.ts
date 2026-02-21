import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchAuthStatus, loginWith, logout } from "./auth-client"

describe("auth-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("fetchAuthStatus", () => {
    it("calls /auth/me and returns status when ok", async () => {
      const mockResponse = { authenticated: true, user: { id: "1", email: "test@test.com", name: "Test", avatarUrl: "" } }
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchAuthStatus()
      expect(fetch).toHaveBeenCalledWith("/auth/me")
      expect(result).toEqual(mockResponse)
    })

    it("returns unauthenticated when fetch fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      const result = await fetchAuthStatus()
      expect(result).toEqual({ authenticated: false })
    })
  })

  describe("loginWith", () => {
    it("sets window.location.href for google", () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
        configurable: true,
      })

      loginWith("google")
      expect(window.location.href).toBe("/auth/google")
    })

    it("sets window.location.href for apple", () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
        configurable: true,
      })

      loginWith("apple")
      expect(window.location.href).toBe("/auth/apple")
    })
  })

  describe("logout", () => {
    it("calls POST /auth/logout", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response)

      await logout()
      expect(fetch).toHaveBeenCalledWith("/auth/logout", { method: "POST" })
    })
  })
})
