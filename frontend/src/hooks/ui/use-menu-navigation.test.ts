import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMenuNavigation } from "./use-menu-navigation";

function fireKeyDown(target: HTMLElement, key: string, opts: Partial<KeyboardEvent> = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  target.dispatchEvent(event);
  return event;
}

describe("useMenuNavigation", () => {
  let container: HTMLDivElement;
  let containerRef: React.RefObject<HTMLElement | null>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    containerRef = { current: container };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const items = ["apple", "banana", "cherry"];

  it("when autoSelectFirstItem is true (default), then starts with selectedIndex 0", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when autoSelectFirstItem is false, then starts with selectedIndex -1", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, autoSelectFirstItem: false }),
    );
    // -1 but items.length > 0 so it should be -1
    expect(result.current.selectedIndex).toBe(-1);
  });

  it("when items is empty, then returns undefined selectedIndex", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items: [] }));
    expect(result.current.selectedIndex).toBeUndefined();
  });

  it("when ArrowDown is pressed, then moves to next item", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(1);
  });

  it("when ArrowDown is pressed at last item, then wraps to first", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    // Move to index 2
    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    // Now at 2, next should wrap to 0
    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when ArrowUp is pressed, then moves to previous item", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    // Move down first
    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      fireKeyDown(container, "ArrowUp");
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when ArrowUp is pressed at first item, then wraps to last", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    // At index 0, ArrowUp should wrap to last
    act(() => {
      fireKeyDown(container, "ArrowUp");
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("when Tab is pressed, then moves to next; Shift+Tab moves to previous", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    act(() => {
      fireKeyDown(container, "Tab");
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      fireKeyDown(container, "Tab", { shiftKey: true });
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when Home is pressed, then sets selectedIndex to 0", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(2);

    act(() => {
      fireKeyDown(container, "Home");
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when End is pressed, then sets selectedIndex to last item", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    act(() => {
      fireKeyDown(container, "End");
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("when Enter is pressed with a selected item, then calls onSelect", () => {
    const onSelect = vi.fn();
    renderHook(() => useMenuNavigation({ containerRef, items, onSelect }));

    act(() => {
      fireKeyDown(container, "Enter");
    });
    expect(onSelect).toHaveBeenCalledWith("apple");
  });

  it("when Enter is pressed with selectedIndex -1, then does not call onSelect", () => {
    const onSelect = vi.fn();
    renderHook(() =>
      useMenuNavigation({ containerRef, items, onSelect, autoSelectFirstItem: false }),
    );

    act(() => {
      fireKeyDown(container, "Enter");
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("when Escape is pressed, then calls onClose", () => {
    const onClose = vi.fn();
    renderHook(() => useMenuNavigation({ containerRef, items, onClose }));

    act(() => {
      fireKeyDown(container, "Escape");
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("when orientation is horizontal, then ignores ArrowUp/ArrowDown", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, orientation: "horizontal" }),
    );

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    // Should remain at 0 since ArrowDown is ignored in horizontal
    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      fireKeyDown(container, "ArrowRight");
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      fireKeyDown(container, "ArrowLeft");
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when orientation is vertical, then ignores ArrowLeft/ArrowRight", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, orientation: "vertical" }),
    );

    act(() => {
      fireKeyDown(container, "ArrowRight");
    });
    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(1);
  });

  it("when orientation is both, then responds to all arrow keys", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, orientation: "both" }),
    );

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      fireKeyDown(container, "ArrowRight");
    });
    expect(result.current.selectedIndex).toBe(2);

    act(() => {
      fireKeyDown(container, "ArrowUp");
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      fireKeyDown(container, "ArrowLeft");
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when query changes, then resets selectedIndex", () => {
    const { result, rerender } = renderHook(
      ({ query }) => useMenuNavigation({ containerRef, items, query }),
      { initialProps: { query: "" } },
    );

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(1);

    rerender({ query: "b" });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("when setSelectedIndex is called, then allows manual index setting", () => {
    const { result } = renderHook(() => useMenuNavigation({ containerRef, items }));

    act(() => {
      result.current.setSelectedIndex(2);
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("when Enter is pressed during IME composition, then does not trigger onSelect", () => {
    const onSelect = vi.fn();
    renderHook(() => useMenuNavigation({ containerRef, items, onSelect }));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      });
      container.dispatchEvent(event);
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
