import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWorkspaceAutosave } from "./use-workspace-autosave";

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/workspace-client", () => ({
  createWorkspace: vi.fn(),
  touchWorkspace: vi.fn(),
}));

import { useAuth } from "@/hooks/data/use-auth";
import { createWorkspace, touchWorkspace } from "@/lib/workspace-client";

const mockUseAuth = vi.mocked(useAuth);
const mockCreate = vi.mocked(createWorkspace);
const mockTouch = vi.mocked(touchWorkspace);

beforeEach(() => {
  vi.useFakeTimers();
  mockCreate.mockReset();
  mockTouch.mockReset();
  mockCreate.mockResolvedValue(undefined);
  mockTouch.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useWorkspaceAutosave", () => {
  it("when mounted with authentication, then creates workspace", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Test" } as any,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useWorkspaceAutosave("ws-1"));

    expect(mockCreate).toHaveBeenCalledWith("ws-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("when mounted, then touches workspace every 60s", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Test" } as any,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useWorkspaceAutosave("ws-1"));

    expect(mockTouch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(mockTouch).toHaveBeenCalledWith("ws-1");
    expect(mockTouch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(mockTouch).toHaveBeenCalledTimes(2);
  });

  it("when not authenticated, then does nothing", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useWorkspaceAutosave("ws-1"));

    expect(mockCreate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(120_000);
    expect(mockTouch).not.toHaveBeenCalled();
  });

  it("when unmounted, then cleans up interval", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Test" } as any,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { unmount } = renderHook(() => useWorkspaceAutosave("ws-1"));

    unmount();

    vi.advanceTimersByTime(120_000);
    expect(mockTouch).not.toHaveBeenCalled();
  });
});
