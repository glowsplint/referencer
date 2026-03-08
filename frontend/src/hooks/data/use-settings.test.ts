import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./use-settings";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
});

describe("useSettings", () => {
  it("when initialized, then returns default settings state", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      theme: "auto",
      isLayersOn: false,
      isMultipleRowsLayout: false,
      lockedPanes: { 0: true, 1: true, 2: true, 3: true },
      hideOffscreenArrows: false,
      showStatusBar: true,
      overscroll: true,
      commentPlacement: "right",
    });
  });

  it("when initialized, then returns default annotations state", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.annotations).toEqual({ activeTool: "selection" });
  });

  it("when setTheme is called with dark, then applies .dark class and data-theme", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setTheme("dark");
    });
    expect(result.current.settings.theme).toBe("dark");
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("when setTheme is called with light, then removes .dark class", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setTheme("dark");
    });
    act(() => {
      result.current.setTheme("light");
    });
    expect(result.current.settings.theme).toBe("light");
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("when setTheme is called with sepia, then sets data-theme without .dark class", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setTheme("sepia");
    });
    expect(result.current.settings.theme).toBe("sepia");
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("sepia");
  });

  it("when setTheme is called with high-contrast, then sets .dark class", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setTheme("high-contrast");
    });
    expect(result.current.settings.theme).toBe("high-contrast");
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("high-contrast");
  });

  it("when cycleTheme is called, then cycles through all 5 themes", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe("auto");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.settings.theme).toBe("light");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.settings.theme).toBe("dark");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.settings.theme).toBe("sepia");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.settings.theme).toBe("high-contrast");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.settings.theme).toBe("auto");
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

  it("when togglePaneLocked is called, then toggles only that pane", () => {
    const { result } = renderHook(() => useSettings());

    // All panes start locked
    expect(result.current.isPaneLocked(0)).toBe(true);
    expect(result.current.isPaneLocked(1)).toBe(true);

    act(() => {
      result.current.togglePaneLocked(1);
    });
    // Only pane 1 should be unlocked
    expect(result.current.isPaneLocked(0)).toBe(true);
    expect(result.current.isPaneLocked(1)).toBe(false);
    expect(result.current.isAnyPaneLocked).toBe(true);
  });

  it("when all panes unlocked, isAnyPaneLocked is false", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.togglePaneLocked(0);
      result.current.togglePaneLocked(1);
      result.current.togglePaneLocked(2);
      result.current.togglePaneLocked(3);
    });
    expect(result.current.isAnyPaneLocked).toBe(false);
  });

  it("when isPaneLocked is called for unknown index, then defaults to true", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.isPaneLocked(99)).toBe(true);
  });

  it("when old isLocked format is in localStorage, then migrates to lockedPanes", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        theme: "auto",
        isLocked: false,
      }),
    );

    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.lockedPanes).toEqual({
      0: false,
      1: false,
      2: false,
      3: false,
    });
    expect(result.current.isPaneLocked(0)).toBe(false);
  });

  it("when old isDarkMode format is in localStorage, then migrates to theme", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: true,
      }),
    );

    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe("dark");
  });

  it("when old isDarkMode=false is in localStorage, then migrates to auto", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        isDarkMode: false,
      }),
    );

    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe("auto");
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
      result.current.setTheme("dark");
    });

    expect(result.current.settings.isLayersOn).toBe(false);
    expect(result.current.settings.isMultipleRowsLayout).toBe(false);
    expect(result.current.isPaneLocked(0)).toBe(true);
    expect(result.current.settings.hideOffscreenArrows).toBe(false);
  });

  it("when a setting is toggled, then persists it to localStorage", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setTheme("dark");
    });

    const stored = JSON.parse(localStorage.getItem("referencer-settings")!);
    expect(stored.theme).toBe("dark");
  });

  it("when localStorage has saved settings, then restores them on init", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        theme: "sepia",
        isLayersOn: true,
        isMultipleRowsLayout: false,
        lockedPanes: { 0: false, 1: true, 2: true, 3: true },
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe("sepia");
    expect(result.current.settings.isLayersOn).toBe(true);
  });

  it("when localStorage has invalid JSON, then falls back to defaults", () => {
    localStorage.setItem("referencer-settings", "not-json{{{");

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({
      theme: "auto",
      isLayersOn: false,
      isMultipleRowsLayout: false,
      lockedPanes: { 0: true, 1: true, 2: true, 3: true },
      hideOffscreenArrows: false,
      showStatusBar: true,
      overscroll: true,
      commentPlacement: "right",
    });
  });

  it("when localStorage has partial data, then fills missing keys with defaults", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        theme: "dark",
      }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe("dark");
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

  it("when persisted settings have dark theme, then applies dark class on mount", () => {
    localStorage.setItem(
      "referencer-settings",
      JSON.stringify({
        theme: "dark",
      }),
    );

    renderHook(() => useSettings());

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("when initialized, then overscroll defaults to true", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.overscroll).toBe(true);
  });

  it("when toggleOverscroll is called, then toggles overscroll", () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.overscroll).toBe(true);

    act(() => {
      result.current.toggleOverscroll();
    });
    expect(result.current.settings.overscroll).toBe(false);

    act(() => {
      result.current.toggleOverscroll();
    });
    expect(result.current.settings.overscroll).toBe(true);
  });

  it("when reorderLockedPanes is called, then permutes lock state", () => {
    const { result } = renderHook(() => useSettings());

    // Unlock pane 0, keep 1 locked
    act(() => {
      result.current.togglePaneLocked(0);
    });
    expect(result.current.isPaneLocked(0)).toBe(false);
    expect(result.current.isPaneLocked(1)).toBe(true);

    // Swap panes 0 and 1
    act(() => {
      result.current.reorderLockedPanes([1, 0]);
    });
    // After swap: pane 0 gets old pane 1's state (true), pane 1 gets old pane 0's state (false)
    expect(result.current.isPaneLocked(0)).toBe(true);
    expect(result.current.isPaneLocked(1)).toBe(false);
  });

  it("when auto theme, then resolvedTheme reflects OS preference", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe("auto");
    // resolvedTheme should be either "light" or "dark" based on OS
    expect(["light", "dark"]).toContain(result.current.resolvedTheme);
  });
});
