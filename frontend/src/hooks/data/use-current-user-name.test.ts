import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrentUserName } from "./use-current-user-name";
import { STORAGE_KEYS } from "@/constants/storage-keys";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useCurrentUserName", () => {
  it("returns OAuth user name when available", () => {
    mockUseAuth.mockReturnValue({
      user: { name: "John Doe" } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useCurrentUserName());
    expect(result.current).toBe("John Doe");
  });

  it("falls back to localStorage USER_NAME", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    localStorage.setItem(STORAGE_KEYS.USER_NAME, "Stored User");

    const { result } = renderHook(() => useCurrentUserName());
    expect(result.current).toBe("Stored User");
  });

  it("falls back to 'You' when no auth and no localStorage", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useCurrentUserName());
    expect(result.current).toBe("You");
  });

  it("prefers OAuth name over localStorage", () => {
    mockUseAuth.mockReturnValue({
      user: { name: "OAuth User" } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    localStorage.setItem(STORAGE_KEYS.USER_NAME, "Stored User");

    const { result } = renderHook(() => useCurrentUserName());
    expect(result.current).toBe("OAuth User");
  });
});
