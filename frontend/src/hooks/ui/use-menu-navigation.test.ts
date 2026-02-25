import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMenuNavigation } from "./use-menu-navigation";
import React from "react";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeContainer() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function makeContainerRef(el: HTMLElement): React.RefObject<HTMLElement> {
  return { current: el };
}

describe("useMenuNavigation", () => {
  describe("when initially rendered with default options", () => {
    it("returns selectedIndex 0 with autoSelectFirstItem", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
        }),
      );
      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });
  });

  describe("when autoSelectFirstItem is false", () => {
    it("returns selectedIndex as undefined (-1 mapped)", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          autoSelectFirstItem: false,
        }),
      );
      // selectedIndex is -1 internally but items.length > 0 so it returns -1
      // Actually the hook returns selectedIndex directly when items.length > 0
      expect(result.current.selectedIndex).toBe(-1);
      container.remove();
    });
  });

  describe("when items is empty", () => {
    it("returns selectedIndex as undefined", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: [],
        }),
      );
      expect(result.current.selectedIndex).toBeUndefined();
      container.remove();
    });
  });

  describe("when ArrowDown is pressed in vertical orientation", () => {
    it("moves selection to the next item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "vertical",
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(1);
      container.remove();
    });

    it("wraps around to the first item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "vertical",
        }),
      );

      // Move to last
      act(() => {
        result.current.setSelectedIndex(2);
      });
      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });
  });

  describe("when ArrowUp is pressed in vertical orientation", () => {
    it("moves selection to the previous item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "vertical",
        }),
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });
      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(1);
      container.remove();
    });

    it("wraps around to the last item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "vertical",
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(2);
      container.remove();
    });
  });

  describe("when ArrowDown is pressed in horizontal orientation", () => {
    it("does not move selection", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "horizontal",
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });
  });

  describe("when ArrowRight is pressed in horizontal orientation", () => {
    it("moves selection to the next item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "horizontal",
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(1);
      container.remove();
    });
  });

  describe("when ArrowLeft is pressed in horizontal orientation", () => {
    it("moves selection to the previous item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "horizontal",
        }),
      );

      act(() => {
        result.current.setSelectedIndex(1);
      });
      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });
  });

  describe("when ArrowRight is pressed in vertical orientation", () => {
    it("does not move selection", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "vertical",
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });
  });

  describe("when Tab is pressed", () => {
    it("moves to next item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(1);
      container.remove();
    });

    it("moves to previous item with Shift+Tab", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
        }),
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });
      act(() => {
        container.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }),
        );
      });

      expect(result.current.selectedIndex).toBe(1);
      container.remove();
    });
  });

  describe("when Home is pressed", () => {
    it("selects the first item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
        }),
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });
      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });
  });

  describe("when End is pressed", () => {
    it("selects the last item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
      });

      expect(result.current.selectedIndex).toBe(2);
      container.remove();
    });
  });

  describe("when Enter is pressed", () => {
    it("calls onSelect with the selected item", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const onSelect = vi.fn();
      renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          onSelect,
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });

      expect(onSelect).toHaveBeenCalledWith("a");
      container.remove();
    });

    it("does not call onSelect when selectedIndex is -1", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const onSelect = vi.fn();
      renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          onSelect,
          autoSelectFirstItem: false,
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });

      expect(onSelect).not.toHaveBeenCalled();
      container.remove();
    });
  });

  describe("when Escape is pressed", () => {
    it("calls onClose", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const onClose = vi.fn();
      renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          onClose,
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });

      expect(onClose).toHaveBeenCalled();
      container.remove();
    });
  });

  describe("when query changes", () => {
    it("resets selectedIndex to 0 with autoSelectFirstItem", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result, rerender } = renderHook(
        ({ query }) =>
          useMenuNavigation({
            containerRef: ref,
            items: ["a", "b", "c"],
            query,
            autoSelectFirstItem: true,
          }),
        { initialProps: { query: "x" } },
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });
      rerender({ query: "y" });

      expect(result.current.selectedIndex).toBe(0);
      container.remove();
    });

    it("resets selectedIndex to -1 with autoSelectFirstItem false", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result, rerender } = renderHook(
        ({ query }) =>
          useMenuNavigation({
            containerRef: ref,
            items: ["a", "b", "c"],
            query,
            autoSelectFirstItem: false,
          }),
        { initialProps: { query: "x" } },
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });
      rerender({ query: "y" });

      expect(result.current.selectedIndex).toBe(-1);
      container.remove();
    });
  });

  describe("when both orientation is set", () => {
    it("responds to both ArrowDown and ArrowRight", () => {
      const container = makeContainer();
      const ref = makeContainerRef(container);
      const { result } = renderHook(() =>
        useMenuNavigation({
          containerRef: ref,
          items: ["a", "b", "c"],
          orientation: "both",
        }),
      );

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      });
      expect(result.current.selectedIndex).toBe(1);

      act(() => {
        container.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      });
      expect(result.current.selectedIndex).toBe(2);
      container.remove();
    });
  });
});
