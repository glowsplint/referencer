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

  it("starts with selectedIndex 0 when autoSelectFirstItem is true (default)", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );
    expect(result.current.selectedIndex).toBe(0);
  });

  it("starts with selectedIndex -1 when autoSelectFirstItem is false", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, autoSelectFirstItem: false }),
    );
    // -1 but items.length > 0 so it should be -1
    expect(result.current.selectedIndex).toBe(-1);
  });

  it("returns undefined selectedIndex when items is empty", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items: [] }),
    );
    expect(result.current.selectedIndex).toBeUndefined();
  });

  it("ArrowDown moves to next item", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    act(() => {
      fireKeyDown(container, "ArrowDown");
    });
    expect(result.current.selectedIndex).toBe(1);
  });

  it("ArrowDown wraps around to first item", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    // Move to index 2
    act(() => { fireKeyDown(container, "ArrowDown"); });
    act(() => { fireKeyDown(container, "ArrowDown"); });
    // Now at 2, next should wrap to 0
    act(() => { fireKeyDown(container, "ArrowDown"); });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("ArrowUp moves to previous item", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    // Move down first
    act(() => { fireKeyDown(container, "ArrowDown"); });
    expect(result.current.selectedIndex).toBe(1);

    act(() => { fireKeyDown(container, "ArrowUp"); });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("ArrowUp wraps around to last item", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    // At index 0, ArrowUp should wrap to last
    act(() => { fireKeyDown(container, "ArrowUp"); });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("Tab moves to next, Shift+Tab moves to previous", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    act(() => { fireKeyDown(container, "Tab"); });
    expect(result.current.selectedIndex).toBe(1);

    act(() => { fireKeyDown(container, "Tab", { shiftKey: true }); });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("Home sets selectedIndex to 0", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    act(() => { fireKeyDown(container, "ArrowDown"); });
    act(() => { fireKeyDown(container, "ArrowDown"); });
    expect(result.current.selectedIndex).toBe(2);

    act(() => { fireKeyDown(container, "Home"); });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("End sets selectedIndex to last item", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    act(() => { fireKeyDown(container, "End"); });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("Enter calls onSelect with the selected item", () => {
    const onSelect = vi.fn();
    renderHook(() =>
      useMenuNavigation({ containerRef, items, onSelect }),
    );

    act(() => { fireKeyDown(container, "Enter"); });
    expect(onSelect).toHaveBeenCalledWith("apple");
  });

  it("Enter does not call onSelect when selectedIndex is -1", () => {
    const onSelect = vi.fn();
    renderHook(() =>
      useMenuNavigation({ containerRef, items, onSelect, autoSelectFirstItem: false }),
    );

    act(() => { fireKeyDown(container, "Enter"); });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("Escape calls onClose", () => {
    const onClose = vi.fn();
    renderHook(() =>
      useMenuNavigation({ containerRef, items, onClose }),
    );

    act(() => { fireKeyDown(container, "Escape"); });
    expect(onClose).toHaveBeenCalled();
  });

  it("horizontal orientation ignores ArrowUp/ArrowDown", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, orientation: "horizontal" }),
    );

    act(() => { fireKeyDown(container, "ArrowDown"); });
    // Should remain at 0 since ArrowDown is ignored in horizontal
    expect(result.current.selectedIndex).toBe(0);

    act(() => { fireKeyDown(container, "ArrowRight"); });
    expect(result.current.selectedIndex).toBe(1);

    act(() => { fireKeyDown(container, "ArrowLeft"); });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("vertical orientation ignores ArrowLeft/ArrowRight", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, orientation: "vertical" }),
    );

    act(() => { fireKeyDown(container, "ArrowRight"); });
    expect(result.current.selectedIndex).toBe(0);

    act(() => { fireKeyDown(container, "ArrowDown"); });
    expect(result.current.selectedIndex).toBe(1);
  });

  it("both orientation responds to all arrow keys", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items, orientation: "both" }),
    );

    act(() => { fireKeyDown(container, "ArrowDown"); });
    expect(result.current.selectedIndex).toBe(1);

    act(() => { fireKeyDown(container, "ArrowRight"); });
    expect(result.current.selectedIndex).toBe(2);

    act(() => { fireKeyDown(container, "ArrowUp"); });
    expect(result.current.selectedIndex).toBe(1);

    act(() => { fireKeyDown(container, "ArrowLeft"); });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("resets selectedIndex when query changes", () => {
    const { result, rerender } = renderHook(
      ({ query }) => useMenuNavigation({ containerRef, items, query }),
      { initialProps: { query: "" } },
    );

    act(() => { fireKeyDown(container, "ArrowDown"); });
    expect(result.current.selectedIndex).toBe(1);

    rerender({ query: "b" });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("setSelectedIndex allows manual index setting", () => {
    const { result } = renderHook(() =>
      useMenuNavigation({ containerRef, items }),
    );

    act(() => { result.current.setSelectedIndex(2); });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("Enter during IME composition does not trigger onSelect", () => {
    const onSelect = vi.fn();
    renderHook(() =>
      useMenuNavigation({ containerRef, items, onSelect }),
    );

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
