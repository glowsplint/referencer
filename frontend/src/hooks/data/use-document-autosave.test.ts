import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentAutosave } from "./use-document-autosave";

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/document-client", () => ({
  createDocument: vi.fn(),
  touchDocument: vi.fn(),
}));

import { useAuth } from "@/hooks/data/use-auth";
import { createDocument, touchDocument } from "@/lib/document-client";
import type { AuthUser } from "@/lib/auth-client";

const mockUseAuth = vi.mocked(useAuth);
const mockCreate = vi.mocked(createDocument);
const mockTouch = vi.mocked(touchDocument);

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

describe("useDocumentAutosave", () => {
  it("when mounted with authentication, then creates document", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Test" } as unknown as AuthUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useDocumentAutosave("ws-1"));

    expect(mockCreate).toHaveBeenCalledWith("ws-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("when mounted, then touches document every 60s", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Test" } as unknown as AuthUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useDocumentAutosave("ws-1"));

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

    renderHook(() => useDocumentAutosave("ws-1"));

    expect(mockCreate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(120_000);
    expect(mockTouch).not.toHaveBeenCalled();
  });

  it("when unmounted, then cleans up interval", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { name: "Test" } as unknown as AuthUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { unmount } = renderHook(() => useDocumentAutosave("ws-1"));

    unmount();

    vi.advanceTimersByTime(120_000);
    expect(mockTouch).not.toHaveBeenCalled();
  });
});
