import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/dom", () => ({
  isEditableElement: vi.fn(() => false),
}));

import { useActionConsole } from "./use-action-console";
import { isEditableElement } from "@/lib/dom";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEditableElement).mockReturnValue(false);
});

describe("useActionConsole", () => {
  describe("when initially rendered", () => {
    it("returns isOpen as false", () => {
      const { result } = renderHook(() => useActionConsole());
      expect(result.current.isOpen).toBe(false);
    });

    it("returns default consoleHeight of 192", () => {
      const { result } = renderHook(() => useActionConsole());
      expect(result.current.consoleHeight).toBe(192);
    });
  });

  describe("when backtick key is pressed", () => {
    it("toggles isOpen to true", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("toggles isOpen back to false on second press", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
      });
      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("when backtick is pressed with modifier keys", () => {
    it("does not toggle when metaKey is held", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "`", metaKey: true, bubbles: true }),
        );
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("does not toggle when ctrlKey is held", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "`", ctrlKey: true, bubbles: true }),
        );
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("does not toggle when altKey is held", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "`", altKey: true, bubbles: true }),
        );
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("does not toggle when shiftKey is held", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "`", shiftKey: true, bubbles: true }),
        );
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("when focus is in an editable element", () => {
    it("does not toggle", () => {
      vi.mocked(isEditableElement).mockReturnValue(true);
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "`", bubbles: true }));
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("when a different key is pressed", () => {
    it("does not toggle", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("when setIsOpen is called directly", () => {
    it("updates isOpen", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("when setConsoleHeight is called", () => {
    it("updates consoleHeight", () => {
      const { result } = renderHook(() => useActionConsole());

      act(() => {
        result.current.setConsoleHeight(300);
      });

      expect(result.current.consoleHeight).toBe(300);
    });
  });
});
