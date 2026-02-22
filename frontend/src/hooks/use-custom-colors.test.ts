import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCustomColors } from "./use-custom-colors";

const STORAGE_KEY = "referencer-custom-colors";

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

describe("useCustomColors", () => {
  it("returns empty array initially", () => {
    const { result } = renderHook(() => useCustomColors());
    expect(result.current.customColors).toEqual([]);
  });

  it("loads colors from localStorage on mount", () => {
    storageMock._store[STORAGE_KEY] = JSON.stringify(["#ff0000", "#00ff00"]);
    const { result } = renderHook(() => useCustomColors());
    expect(result.current.customColors).toEqual(["#ff0000", "#00ff00"]);
  });

  it("addCustomColor appends a new color", () => {
    const { result } = renderHook(() => useCustomColors());
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    expect(result.current.customColors).toEqual(["#ff0000"]);
  });

  it("addCustomColor persists to localStorage", () => {
    const { result } = renderHook(() => useCustomColors());
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    expect(storageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(["#ff0000"]));
  });

  it("addCustomColor does not add duplicates", () => {
    const { result } = renderHook(() => useCustomColors());
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    expect(result.current.customColors).toEqual(["#ff0000"]);
  });

  it("removeCustomColor removes a color", () => {
    const { result } = renderHook(() => useCustomColors());
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    act(() => {
      result.current.addCustomColor("#00ff00");
    });
    act(() => {
      result.current.removeCustomColor("#ff0000");
    });
    expect(result.current.customColors).toEqual(["#00ff00"]);
  });

  it("removeCustomColor persists to localStorage", () => {
    const { result } = renderHook(() => useCustomColors());
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    act(() => {
      result.current.removeCustomColor("#ff0000");
    });
    expect(storageMock.setItem).toHaveBeenLastCalledWith(STORAGE_KEY, JSON.stringify([]));
  });

  it("removeCustomColor with non-existent color is a no-op", () => {
    const { result } = renderHook(() => useCustomColors());
    act(() => {
      result.current.addCustomColor("#ff0000");
    });
    act(() => {
      result.current.removeCustomColor("#999999");
    });
    expect(result.current.customColors).toEqual(["#ff0000"]);
  });

  it("handles corrupted localStorage gracefully", () => {
    storageMock._store[STORAGE_KEY] = "not-json";
    const { result } = renderHook(() => useCustomColors());
    expect(result.current.customColors).toEqual([]);
  });
});
