import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAuthStatus, loginWith, logout } from "./auth-client";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
  apiUrl: (path: string) => path,
}));

import { apiFetch } from "@/lib/api-client";
const mockApiFetch = vi.mocked(apiFetch);

describe("auth-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchAuthStatus", () => {
    it("calls /auth/me and returns status when ok", async () => {
      const mockResponse = {
        authenticated: true,
        user: { id: "1", email: "test@test.com", name: "Test", avatarUrl: "" },
      };
      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await fetchAuthStatus();
      expect(mockApiFetch).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockResponse);
    });

    it("returns unauthenticated when fetch fails", async () => {
      mockApiFetch.mockRejectedValue(new Error("fail"));

      const result = await fetchAuthStatus();
      expect(result).toEqual({ authenticated: false });
    });
  });

  describe("loginWith", () => {
    it("sets window.location.href for google", () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
        configurable: true,
      });

      loginWith("google");
      expect(window.location.href).toBe("/auth/google");
    });

    it("sets window.location.href for github", () => {
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
        configurable: true,
      });

      loginWith("github");
      expect(window.location.href).toBe("/auth/github");
    });
  });

  describe("logout", () => {
    it("calls POST /auth/logout", async () => {
      mockApiFetch.mockResolvedValue(undefined);

      await logout();
      expect(mockApiFetch).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
    });
  });
});
