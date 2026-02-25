import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnifiedUndo } from "./use-unified-undo";

function makeYjsUndo(overrides: Partial<ReturnType<typeof makeYjsUndo>> = {}) {
  return {
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    ...overrides,
  };
}

function makeHistory(overrides: Partial<ReturnType<typeof makeHistory>> = {}) {
  return {
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    markLastUndone: vi.fn(),
    markLastRedone: vi.fn(),
    entries: [],
    record: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUnifiedUndo", () => {
  describe("when both canUndo are false", () => {
    it("returns canUndo false", () => {
      const yjs = makeYjsUndo();
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe("when yjs canUndo is true", () => {
    it("returns canUndo true", () => {
      const yjs = makeYjsUndo({ canUndo: true });
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe("when only history canUndo is true", () => {
    it("returns canUndo true", () => {
      const yjs = makeYjsUndo();
      const history = makeHistory({ canUndo: true });
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe("when both canRedo are false", () => {
    it("returns canRedo false", () => {
      const yjs = makeYjsUndo();
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("when yjs canRedo is true", () => {
    it("returns canRedo true", () => {
      const yjs = makeYjsUndo({ canRedo: true });
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe("when undo is called and yjs has undo available", () => {
    it("calls yjs.undo and history.markLastUndone", () => {
      const yjs = makeYjsUndo({ canUndo: true });
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));

      act(() => {
        result.current.undo();
      });

      expect(yjs.undo).toHaveBeenCalled();
      expect(history.markLastUndone).toHaveBeenCalled();
      expect(history.undo).not.toHaveBeenCalled();
    });
  });

  describe("when undo is called and only history has undo available", () => {
    it("calls history.undo", () => {
      const yjs = makeYjsUndo({ canUndo: false });
      const history = makeHistory({ canUndo: true });
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));

      act(() => {
        result.current.undo();
      });

      expect(yjs.undo).not.toHaveBeenCalled();
      expect(history.undo).toHaveBeenCalled();
    });
  });

  describe("when undo is called and neither has undo available", () => {
    it("calls nothing", () => {
      const yjs = makeYjsUndo();
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));

      act(() => {
        result.current.undo();
      });

      expect(yjs.undo).not.toHaveBeenCalled();
      expect(history.undo).not.toHaveBeenCalled();
    });
  });

  describe("when redo is called and yjs has redo available", () => {
    it("calls yjs.redo and history.markLastRedone", () => {
      const yjs = makeYjsUndo({ canRedo: true });
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));

      act(() => {
        result.current.redo();
      });

      expect(yjs.redo).toHaveBeenCalled();
      expect(history.markLastRedone).toHaveBeenCalled();
      expect(history.redo).not.toHaveBeenCalled();
    });
  });

  describe("when redo is called and only history has redo available", () => {
    it("calls history.redo", () => {
      const yjs = makeYjsUndo({ canRedo: false });
      const history = makeHistory({ canRedo: true });
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));

      act(() => {
        result.current.redo();
      });

      expect(yjs.redo).not.toHaveBeenCalled();
      expect(history.redo).toHaveBeenCalled();
    });
  });

  describe("when redo is called and neither has redo available", () => {
    it("calls nothing", () => {
      const yjs = makeYjsUndo();
      const history = makeHistory();
      const { result } = renderHook(() => useUnifiedUndo(yjs, history as any));

      act(() => {
        result.current.redo();
      });

      expect(yjs.redo).not.toHaveBeenCalled();
      expect(history.redo).not.toHaveBeenCalled();
    });
  });
});
