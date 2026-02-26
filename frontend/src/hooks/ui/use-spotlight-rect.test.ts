import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpotlightRect } from "./use-spotlight-rect";

// Minimal ResizeObserver mock
class MockResizeObserver {
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  static instances: MockResizeObserver[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.observed = [];
  }
}

beforeEach(() => {
  MockResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSpotlightRect", () => {
  it("when selector is null, then returns null", () => {
    const { result } = renderHook(() => useSpotlightRect(null));
    expect(result.current).toBeNull();
  });

  it("when target element does not exist, then returns null", () => {
    const { result } = renderHook(() => useSpotlightRect("#nonexistent"));
    expect(result.current).toBeNull();
  });

  it("when target element exists, then returns padded bounding rect", () => {
    const el = document.createElement("div");
    el.id = "target";
    document.body.appendChild(el);

    // Mock getBoundingClientRect
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 200, 300, 400));

    const { result } = renderHook(() => useSpotlightRect("#target"));

    // Padded by 4px on each side
    expect(result.current).not.toBeNull();
    expect(result.current!.x).toBe(96);
    expect(result.current!.y).toBe(196);
    expect(result.current!.width).toBe(308);
    expect(result.current!.height).toBe(408);

    el.remove();
  });

  it("when element has display:contents, then computes union rect from children", () => {
    const parent = document.createElement("div");
    parent.setAttribute("data-testid", "contentsEl");
    document.body.appendChild(parent);

    const child1 = document.createElement("div");
    const child2 = document.createElement("div");
    parent.appendChild(child1);
    parent.appendChild(child2);

    // Mock getComputedStyle to return display:contents for parent
    const origGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      if (el === parent) {
        return { display: "contents" } as CSSStyleDeclaration;
      }
      return origGetComputedStyle(el);
    });

    // Mock parent's own getBoundingClientRect (should not be used for contents)
    vi.spyOn(parent, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 0, 0));

    // Mock children's bounding rects
    vi.spyOn(child1, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 20, 50, 30));
    vi.spyOn(child2, "getBoundingClientRect").mockReturnValue(new DOMRect(40, 10, 60, 50));

    const { result } = renderHook(() => useSpotlightRect('[data-testid="contentsEl"]'));

    // Union: left=10, top=10, right=100, bottom=60 => width=90, height=50
    // After padding: x=6, y=6, width=98, height=58
    expect(result.current).not.toBeNull();
    expect(result.current!.x).toBe(6);
    expect(result.current!.y).toBe(6);
    expect(result.current!.width).toBe(98);
    expect(result.current!.height).toBe(58);

    parent.remove();
  });

  it("when element has display:contents with zero-size children, then falls back to element rect", () => {
    const parent = document.createElement("div");
    parent.setAttribute("data-testid", "emptyContents");
    document.body.appendChild(parent);

    const child = document.createElement("div");
    parent.appendChild(child);

    const origGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      if (el === parent) {
        return { display: "contents" } as CSSStyleDeclaration;
      }
      return origGetComputedStyle(el);
    });

    // All children have zero size
    vi.spyOn(child, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 0, 0));

    // Fallback to parent's rect
    vi.spyOn(parent, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 50, 100, 100));

    const { result } = renderHook(() => useSpotlightRect('[data-testid="emptyContents"]'));

    // Padded parent rect
    expect(result.current).not.toBeNull();
    expect(result.current!.x).toBe(46);
    expect(result.current!.y).toBe(46);
    expect(result.current!.width).toBe(108);
    expect(result.current!.height).toBe(108);

    parent.remove();
  });

  it("when element has display:contents, then observes children with ResizeObserver", () => {
    const parent = document.createElement("div");
    parent.setAttribute("data-testid", "roContents");
    document.body.appendChild(parent);

    const child1 = document.createElement("div");
    const child2 = document.createElement("div");
    parent.appendChild(child1);
    parent.appendChild(child2);

    const origGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
      if (el === parent) {
        return { display: "contents" } as CSSStyleDeclaration;
      }
      return origGetComputedStyle(el);
    });

    vi.spyOn(child1, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 10, 50, 50));
    vi.spyOn(child2, "getBoundingClientRect").mockReturnValue(new DOMRect(20, 20, 50, 50));

    renderHook(() => useSpotlightRect('[data-testid="roContents"]'));

    // Should observe parent + both children
    const observer = MockResizeObserver.instances[0];
    expect(observer.observed).toContain(parent);
    expect(observer.observed).toContain(child1);
    expect(observer.observed).toContain(child2);

    parent.remove();
  });
});
