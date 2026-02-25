import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCursorVisibility } from "./use-cursor-visibility";

// Mock the dependency hooks
vi.mock("@/hooks/utilities/use-window-size", () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768, offsetTop: 0, offsetLeft: 0, scale: 1 })),
}));

vi.mock("@/hooks/utilities/use-element-rect", () => ({
  useBodyRect: vi.fn(() => ({
    x: 0, y: 0, width: 1024, height: 2000, top: 0, right: 1024, bottom: 2000, left: 0,
  })),
}));

import type { useWindowSize as _useWindowSize } from "@/hooks/utilities/use-window-size";
import { useBodyRect } from "@/hooks/utilities/use-element-rect";

describe("useCursorVisibility", () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollToSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollToSpy);
    window.scrollTo = scrollToSpy;
  });

  it("when called, then returns the body rect", () => {
    const { result } = renderHook(() =>
      useCursorVisibility({ editor: null }),
    );
    expect(result.current).toEqual(
      expect.objectContaining({ width: 1024, height: 2000 }),
    );
  });

  it("when editor is null, then does not scroll", () => {
    renderHook(() => useCursorVisibility({ editor: null }));
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("when editor is destroyed, then does not scroll", () => {
    const editor = { isDestroyed: true, isFocused: true, state: {}, view: {} } as any;
    renderHook(() => useCursorVisibility({ editor }));
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("when editor is not focused, then does not scroll", () => {
    const editor = {
      isDestroyed: false,
      isFocused: false,
      state: { selection: { from: 0 } },
      view: { coordsAtPos: vi.fn(() => ({ top: 100 })) },
    } as any;
    renderHook(() => useCursorVisibility({ editor }));
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("when cursor is behind the overlay, then scrolls", () => {
    // windowHeight (768) < body height (2000) -- passes first check
    // cursor at y=750, overlayHeight=100 => availableSpace = 768-750 = 18 < 100
    const editor = {
      isDestroyed: false,
      isFocused: true,
      state: { selection: { from: 5 } },
      view: { coordsAtPos: vi.fn(() => ({ top: 750 })) },
    } as any;

    renderHook(() => useCursorVisibility({ editor, overlayHeight: 100 }));
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
  });

  it("when there is enough space, then does not scroll", () => {
    // cursor at y=100, overlayHeight=50 => availableSpace = 768-100 = 668 > 50
    const editor = {
      isDestroyed: false,
      isFocused: true,
      state: { selection: { from: 5 } },
      view: { coordsAtPos: vi.fn(() => ({ top: 100 })) },
    } as any;

    renderHook(() => useCursorVisibility({ editor, overlayHeight: 50 }));
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it("when body fits in viewport, then does not scroll", () => {
    // Make body height smaller than window
    vi.mocked(useBodyRect).mockReturnValue({
      x: 0, y: 0, width: 1024, height: 500, top: 0, right: 1024, bottom: 500, left: 0,
    });

    const editor = {
      isDestroyed: false,
      isFocused: true,
      state: { selection: { from: 5 } },
      view: { coordsAtPos: vi.fn(() => ({ top: 400 })) },
    } as any;

    renderHook(() => useCursorVisibility({ editor, overlayHeight: 100 }));
    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
