import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./use-settings";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.remove("overscroll-enabled");
});

describe("useSettings", () => {
  it("returns initial settings state", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: true,
      showDrawingToasts: true,
      showCommentsToasts: true,
      showHighlightToasts: true,
      overscrollEnabled: false,
      hideOffscreenArrows: false,
      showStatusBar: true,
    });
  });

  it("returns initial annotations state", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.annotations).toEqual({ activeTool: "selection" });
  });

  it("toggleDarkMode toggles isDarkMode and updates classList", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });
    expect(result.current.settings.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.toggleDarkMode();
    });
    expect(result.current.settings.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggleLayersOn toggles isLayersOn", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleLayersOn();
    });
    expect(result.current.settings.isLayersOn).toBe(true);
  });

  it("toggleMultipleRowsLayout toggles isMultipleRowsLayout", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleMultipleRowsLayout();
    });
    expect(result.current.settings.isMultipleRowsLayout).toBe(true);
  });

  it("toggleLocked toggles isLocked", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleLocked();
    });
    expect(result.current.settings.isLocked).toBe(false);
  });

  it("setActiveTool changes the active tool", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setActiveTool("arrow");
    });
    expect(result.current.annotations.activeTool).toBe("arrow");

    act(() => {
      result.current.setActiveTool("comments");
    });
    expect(result.current.annotations.activeTool).toBe("comments");

    act(() => {
      result.current.setActiveTool("selection");
    });
    expect(result.current.annotations.activeTool).toBe("selection");
  });

  it("toggleShowDrawingToasts toggles showDrawingToasts", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.showDrawingToasts).toBe(true);

    act(() => {
      result.current.toggleShowDrawingToasts();
    });
    expect(result.current.settings.showDrawingToasts).toBe(false);

    act(() => {
      result.current.toggleShowDrawingToasts();
    });
    expect(result.current.settings.showDrawingToasts).toBe(true);
  });

  it("toggleShowCommentsToasts toggles showCommentsToasts", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.showCommentsToasts).toBe(true);

    act(() => {
      result.current.toggleShowCommentsToasts();
    });
    expect(result.current.settings.showCommentsToasts).toBe(false);

    act(() => {
      result.current.toggleShowCommentsToasts();
    });
    expect(result.current.settings.showCommentsToasts).toBe(true);
  });

  it("toggling one setting does not affect others", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.settings.isLayersOn).toBe(false);
    expect(result.current.settings.isMultipleRowsLayout).toBe(false);
    expect(result.current.settings.isLocked).toBe(true);
    expect(result.current.settings.showDrawingToasts).toBe(true);
    expect(result.current.settings.showCommentsToasts).toBe(true);
    expect(result.current.settings.showHighlightToasts).toBe(true);
    expect(result.current.settings.overscrollEnabled).toBe(false);
    expect(result.current.settings.hideOffscreenArrows).toBe(false);
  });

  it("toggleShowHighlightToasts toggles showHighlightToasts", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.showHighlightToasts).toBe(true);

    act(() => {
      result.current.toggleShowHighlightToasts();
    });
    expect(result.current.settings.showHighlightToasts).toBe(false);

    act(() => {
      result.current.toggleShowHighlightToasts();
    });
    expect(result.current.settings.showHighlightToasts).toBe(true);
  });

  it("toggleOverscrollEnabled toggles overscrollEnabled and updates classList", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.overscrollEnabled).toBe(false);
    expect(document.documentElement.classList.contains("overscroll-enabled")).toBe(false);

    act(() => {
      result.current.toggleOverscrollEnabled();
    });
    expect(result.current.settings.overscrollEnabled).toBe(true);
    expect(document.documentElement.classList.contains("overscroll-enabled")).toBe(true);

    act(() => {
      result.current.toggleOverscrollEnabled();
    });
    expect(result.current.settings.overscrollEnabled).toBe(false);
    expect(document.documentElement.classList.contains("overscroll-enabled")).toBe(false);
  });

  it("persists settings to localStorage when toggled", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });

    const stored = JSON.parse(localStorage.getItem("referencer-settings")!);
    expect(stored.isDarkMode).toBe(true);
  });

  it("restores settings from localStorage on init", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: true,
        isLayersOn: true,
        isMultipleRowsLayout: false,
        isLocked: false,
        showDrawingToasts: false,
        showCommentsToasts: true,
        showHighlightToasts: true,
        overscrollEnabled: false,
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.isDarkMode).toBe(true);
    expect(result.current.settings.isLayersOn).toBe(true);
    expect(result.current.settings.showDrawingToasts).toBe(false);
  });

  it("falls back to defaults when localStorage has invalid JSON", () => {
    localStorage.setItem("referencer-settings", "not-json{{{");

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: true,
      showDrawingToasts: true,
      showCommentsToasts: true,
      showHighlightToasts: true,
      overscrollEnabled: false,
      hideOffscreenArrows: false,
      showStatusBar: true,
    });
  });

  it("fills missing keys with defaults when localStorage has partial data", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: true,
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.isDarkMode).toBe(true);
    expect(result.current.settings.isLayersOn).toBe(false);
    expect(result.current.settings.showDrawingToasts).toBe(true);
    expect(result.current.settings.showCommentsToasts).toBe(true);
    expect(result.current.settings.showHighlightToasts).toBe(true);
    expect(result.current.settings.overscrollEnabled).toBe(false);
    expect(result.current.settings.hideOffscreenArrows).toBe(false);
  });

  it("toggleHideOffscreenArrows toggles hideOffscreenArrows", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.hideOffscreenArrows).toBe(false);

    act(() => {
      result.current.toggleHideOffscreenArrows();
    });
    expect(result.current.settings.hideOffscreenArrows).toBe(true);

    act(() => {
      result.current.toggleHideOffscreenArrows();
    });
    expect(result.current.settings.hideOffscreenArrows).toBe(false);
  });

  it("toggleShowStatusBar toggles showStatusBar", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.showStatusBar).toBe(true);

    act(() => {
      result.current.toggleShowStatusBar();
    });
    expect(result.current.settings.showStatusBar).toBe(false);

    act(() => {
      result.current.toggleShowStatusBar();
    });
    expect(result.current.settings.showStatusBar).toBe(true);
  });

  it("applies dark mode class on mount from persisted settings", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: true,
      }),
    );

    renderHook(() => useSettings());

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
