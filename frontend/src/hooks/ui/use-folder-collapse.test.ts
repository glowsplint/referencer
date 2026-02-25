import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFolderCollapse } from "./use-folder-collapse";

const PREFIX = "referencer-folder-collapsed-";

function makeStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

let storageMock: ReturnType<typeof makeStorageMock>;

beforeEach(() => {
  storageMock = makeStorageMock();
  vi.stubGlobal("localStorage", storageMock);
});

describe("useFolderCollapse", () => {
  it("when initialized, then defaults to expanded", () => {
    const { result } = renderHook(() => useFolderCollapse("folder-1"));
    expect(result.current.isCollapsed).toBe(false);
  });

  it("when toggle is called while expanded, then collapses", () => {
    const { result } = renderHook(() => useFolderCollapse("folder-1"));
    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.isCollapsed).toBe(true);
  });

  it("when toggle is called while collapsed, then expands", () => {
    const { result } = renderHook(() => useFolderCollapse("folder-1"));
    act(() => {
      result.current.toggleCollapsed();
    });
    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.isCollapsed).toBe(false);
  });

  it("when collapsed, then persists state to localStorage", () => {
    const { result } = renderHook(() => useFolderCollapse("folder-1"));
    act(() => {
      result.current.toggleCollapsed();
    });
    expect(storageMock.setItem).toHaveBeenCalledWith(PREFIX + "folder-1", "true");
  });

  it("when expanded, then removes localStorage key", () => {
    const { result } = renderHook(() => useFolderCollapse("folder-1"));
    act(() => {
      result.current.toggleCollapsed();
    });
    act(() => {
      result.current.toggleCollapsed();
    });
    expect(storageMock.removeItem).toHaveBeenCalledWith(PREFIX + "folder-1");
  });

  it("when localStorage has collapsed state, then reads it on init", () => {
    storageMock._store[PREFIX + "folder-1"] = "true";
    const { result } = renderHook(() => useFolderCollapse("folder-1"));
    expect(result.current.isCollapsed).toBe(true);
  });

  it("when different folder IDs are used, then uses different storage keys", () => {
    storageMock._store[PREFIX + "folder-A"] = "true";
    const { result: resultA } = renderHook(() => useFolderCollapse("folder-A"));
    const { result: resultB } = renderHook(() => useFolderCollapse("folder-B"));
    expect(resultA.current.isCollapsed).toBe(true);
    expect(resultB.current.isCollapsed).toBe(false);
  });
});
