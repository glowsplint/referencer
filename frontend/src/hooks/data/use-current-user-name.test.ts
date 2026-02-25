import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

import { useCurrentUserName } from "./use-current-user-name";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS } from "@/constants/storage-keys";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(useAuth).mockReturnValue({ user: null } as any);
});

describe("useCurrentUserName", () => {
  describe("when OAuth user has a name", () => {
    it("returns the OAuth user name", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { name: "John Doe" },
      } as any);

      const { result } = renderHook(() => useCurrentUserName());
      expect(result.current).toBe("John Doe");
    });
  });

  describe("when OAuth user has no name but localStorage has a name", () => {
    it("returns the localStorage name", () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, "Local User");

      const { result } = renderHook(() => useCurrentUserName());
      expect(result.current).toBe("Local User");
    });
  });

  describe("when neither OAuth nor localStorage has a name", () => {
    it("returns 'You' as fallback", () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useCurrentUserName());
      expect(result.current).toBe("You");
    });
  });

  describe("when OAuth user exists but name is empty", () => {
    it("falls through to localStorage", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { name: "" },
      } as any);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, "Storage Name");

      const { result } = renderHook(() => useCurrentUserName());
      expect(result.current).toBe("Storage Name");
    });
  });

  describe("when OAuth user name is null", () => {
    it("falls through to localStorage", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { name: null },
      } as any);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, "Stored");

      const { result } = renderHook(() => useCurrentUserName());
      expect(result.current).toBe("Stored");
    });
  });
});
