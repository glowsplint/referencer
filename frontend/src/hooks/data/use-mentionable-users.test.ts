import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMentionableUsers } from "./use-mentionable-users";

// Mock apiFetch
vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}));

describe("useMentionableUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when provider is null", () => {
    const { result } = renderHook(() => useMentionableUsers(null, "doc-1"));
    expect(result.current).toEqual([]);
  });

  it("returns empty array with no awareness users and no members", () => {
    const mockProvider = {
      awareness: {
        clientID: 1,
        getStates: () => new Map(),
        on: vi.fn(),
        off: vi.fn(),
      },
    } as any;
    const { result } = renderHook(() => useMentionableUsers(mockProvider, "doc-1"));
    expect(result.current).toEqual([]);
  });
});
