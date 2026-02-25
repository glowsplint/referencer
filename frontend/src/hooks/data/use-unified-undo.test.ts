import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnifiedUndo } from "./use-unified-undo";

function makeMockYjsUndo(overrides: Partial<{ canUndo: boolean; canRedo: boolean }> = {}) {
  return {
    canUndo: overrides.canUndo ?? false,
    canRedo: overrides.canRedo ?? false,
    undo: vi.fn(),
    redo: vi.fn(),
  };
}

function makeMockHistory(overrides: Partial<{ canUndo: boolean; canRedo: boolean }> = {}) {
  return {
    canUndo: overrides.canUndo ?? false,
    canRedo: overrides.canRedo ?? false,
    undo: vi.fn(),
    redo: vi.fn(),
    record: vi.fn(),
    logOnly: vi.fn(),
    log: [],
    markLastUndone: vi.fn(),
    markLastRedone: vi.fn(),
  };
}

describe("useUnifiedUndo", () => {
  it("prefers Yjs undo when yjsUndo.canUndo is true", () => {
    const yjsUndo = makeMockYjsUndo({ canUndo: true });
    const history = makeMockHistory({ canUndo: true });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));

    act(() => {
      result.current.undo();
    });

    expect(yjsUndo.undo).toHaveBeenCalledOnce();
    expect(history.markLastUndone).toHaveBeenCalledOnce();
    expect(history.undo).not.toHaveBeenCalled();
  });

  it("falls back to action history undo when yjsUndo.canUndo is false", () => {
    const yjsUndo = makeMockYjsUndo({ canUndo: false });
    const history = makeMockHistory({ canUndo: true });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));

    act(() => {
      result.current.undo();
    });

    expect(yjsUndo.undo).not.toHaveBeenCalled();
    expect(history.undo).toHaveBeenCalledOnce();
  });

  it("does nothing when neither source can undo", () => {
    const yjsUndo = makeMockYjsUndo({ canUndo: false });
    const history = makeMockHistory({ canUndo: false });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));

    act(() => {
      result.current.undo();
    });

    expect(yjsUndo.undo).not.toHaveBeenCalled();
    expect(history.undo).not.toHaveBeenCalled();
  });

  it("prefers Yjs redo when yjsUndo.canRedo is true", () => {
    const yjsUndo = makeMockYjsUndo({ canRedo: true });
    const history = makeMockHistory({ canRedo: true });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));

    act(() => {
      result.current.redo();
    });

    expect(yjsUndo.redo).toHaveBeenCalledOnce();
    expect(history.markLastRedone).toHaveBeenCalledOnce();
    expect(history.redo).not.toHaveBeenCalled();
  });

  it("falls back to action history redo when yjsUndo.canRedo is false", () => {
    const yjsUndo = makeMockYjsUndo({ canRedo: false });
    const history = makeMockHistory({ canRedo: true });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));

    act(() => {
      result.current.redo();
    });

    expect(yjsUndo.redo).not.toHaveBeenCalled();
    expect(history.redo).toHaveBeenCalledOnce();
  });

  it("canUndo is true when either source can undo", () => {
    const yjsUndo = makeMockYjsUndo({ canUndo: true });
    const history = makeMockHistory({ canUndo: false });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));
    expect(result.current.canUndo).toBe(true);
  });

  it("canUndo is true when only history can undo", () => {
    const yjsUndo = makeMockYjsUndo({ canUndo: false });
    const history = makeMockHistory({ canUndo: true });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));
    expect(result.current.canUndo).toBe(true);
  });

  it("canUndo is false when neither source can undo", () => {
    const yjsUndo = makeMockYjsUndo({ canUndo: false });
    const history = makeMockHistory({ canUndo: false });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));
    expect(result.current.canUndo).toBe(false);
  });

  it("canRedo reflects both sources", () => {
    const yjsUndo = makeMockYjsUndo({ canRedo: false });
    const history = makeMockHistory({ canRedo: true });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));
    expect(result.current.canRedo).toBe(true);
  });

  it("canRedo is false when neither source can redo", () => {
    const yjsUndo = makeMockYjsUndo({ canRedo: false });
    const history = makeMockHistory({ canRedo: false });

    const { result } = renderHook(() => useUnifiedUndo(yjsUndo, history));
    expect(result.current.canRedo).toBe(false);
  });
});
