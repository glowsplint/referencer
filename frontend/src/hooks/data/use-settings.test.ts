import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./use-settings";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");

});

describe("useSettings", () => {
  it("when initialized, then returns default settings state", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: true,
      hideOffscreenArrows: false,
      showStatusBar: true,
      commentPlacement: "right",
      thirdEditorFullWidth: true,
    });
  });

  it("when initialized, then returns default annotations state", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.annotations).toEqual({ activeTool: "selection" });
  });

  it("when toggleDarkMode is called, then toggles isDarkMode and updates classList", () => {
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

  it("when toggleLayersOn is called, then toggles isLayersOn", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleLayersOn();
    });
    expect(result.current.settings.isLayersOn).toBe(true);
  });

  it("when toggleMultipleRowsLayout is called, then toggles isMultipleRowsLayout", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleMultipleRowsLayout();
    });
    expect(result.current.settings.isMultipleRowsLayout).toBe(true);
  });

  it("when toggleLocked is called, then toggles isLocked", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleLocked();
    });
    expect(result.current.settings.isLocked).toBe(false);
  });

  it("when setActiveTool is called, then changes the active tool", () => {
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

  it("when one setting is toggled, then does not affect other settings", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.settings.isLayersOn).toBe(false);
    expect(result.current.settings.isMultipleRowsLayout).toBe(false);
    expect(result.current.settings.isLocked).toBe(true);
    expect(result.current.settings.hideOffscreenArrows).toBe(false);
  });

  it("when a setting is toggled, then persists it to localStorage", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.toggleDarkMode();
    });

    const stored = JSON.parse(localStorage.getItem("referencer-settings")!);
    expect(stored.isDarkMode).toBe(true);
  });

  it("when localStorage has saved settings, then restores them on init", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: true,
        isLayersOn: true,
        isMultipleRowsLayout: false,
        isLocked: false,
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.isDarkMode).toBe(true);
    expect(result.current.settings.isLayersOn).toBe(true);
  });

  it("when localStorage has invalid JSON, then falls back to defaults", () => {
    localStorage.setItem("referencer-settings", "not-json{{{");

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: true,
      hideOffscreenArrows: false,
      showStatusBar: true,
      commentPlacement: "right",
      thirdEditorFullWidth: true,
    });
  });

  it("when localStorage has partial data, then fills missing keys with defaults", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: true,
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.isDarkMode).toBe(true);
    expect(result.current.settings.isLayersOn).toBe(false);
    expect(result.current.settings.hideOffscreenArrows).toBe(false);
  });

  it("when toggleHideOffscreenArrows is called, then toggles hideOffscreenArrows", () => {
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

  it("when toggleShowStatusBar is called, then toggles showStatusBar", () => {
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

  it("when persisted settings have dark mode enabled, then applies dark class on mount", () => {
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
