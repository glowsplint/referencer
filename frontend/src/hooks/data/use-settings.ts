// Manages all UI settings (dark mode, layout, lock state) persisted to
// localStorage. Also tracks transient annotation state like the active tool,
// arrow style picker, and selected arrow.
import { useEffect, useState, useCallback, useMemo } from "react";
import type { EditorSettings, AnnotationSettings, ActiveTool, ArrowStyle } from "@/types/editor";
import { STORAGE_KEYS } from "@/constants/storage-keys";

const DEFAULT_LOCKED_PANES: Record<number, boolean> = { 0: true, 1: true, 2: true, 3: true };

const DEFAULT_SETTINGS: EditorSettings = {
  isDarkMode: false,
  isLayersOn: false,
  isMultipleRowsLayout: false,
  lockedPanes: DEFAULT_LOCKED_PANES,
  hideOffscreenArrows: false,
  showStatusBar: true,
  overscroll: true,
  commentPlacement: "right",
};

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Migrate old `isLocked: boolean` format to `lockedPanes`
    if ("isLocked" in parsed && !("lockedPanes" in parsed)) {
      const locked = parsed.isLocked as boolean;
      parsed.lockedPanes = { 0: locked, 1: locked, 2: locked, 3: locked };
      delete parsed.isLocked;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function useToggle<T>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) {
  return useCallback(() => setter((prev) => ({ ...prev, [key]: !prev[key] })), [setter, key]);
}

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);
  const [annotations, setAnnotations] = useState<AnnotationSettings>({
    activeTool: "selection",
  });
  const [activeArrowStyle, setActiveArrowStyle] = useState<ArrowStyle>("solid");
  const [arrowStylePickerOpen, setArrowStylePickerOpen] = useState(false);
  const [selectedArrow, setSelectedArrow] = useState<{ layerId: string; arrowId: string } | null>(
    null,
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      /* quota exceeded or unavailable */
    }
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode);
  }, [settings.isDarkMode]);

  const toggleDarkMode = useToggle(setSettings, "isDarkMode");
  const toggleLayersOn = useToggle(setSettings, "isLayersOn");
  const toggleMultipleRowsLayout = useToggle(setSettings, "isMultipleRowsLayout");
  const toggleHideOffscreenArrows = useToggle(setSettings, "hideOffscreenArrows");
  const toggleShowStatusBar = useToggle(setSettings, "showStatusBar");
  const toggleOverscroll = useToggle(setSettings, "overscroll");
  const toggleCommentPlacement = useCallback(
    () =>
      setSettings((prev) => {
        const next =
          prev.commentPlacement === "right"
            ? "left"
            : prev.commentPlacement === "left"
              ? "both"
              : "right";
        return { ...prev, commentPlacement: next as EditorSettings["commentPlacement"] };
      }),
    [],
  );
  const togglePaneLocked = useCallback((index: number) => {
    setSettings((prev) => ({
      ...prev,
      lockedPanes: { ...prev.lockedPanes, [index]: !(prev.lockedPanes[index] ?? true) },
    }));
  }, []);

  const isPaneLocked = useCallback(
    (index: number): boolean => settings.lockedPanes[index] ?? true,
    [settings.lockedPanes],
  );

  const isAnyPaneLocked = useMemo(
    () => Object.values(settings.lockedPanes).some(Boolean),
    [settings.lockedPanes],
  );

  const reorderLockedPanes = useCallback((permutation: number[]) => {
    setSettings((prev) => {
      const newLocked: Record<number, boolean> = {};
      for (let newIdx = 0; newIdx < permutation.length; newIdx++) {
        newLocked[newIdx] = prev.lockedPanes[permutation[newIdx]] ?? true;
      }
      return { ...prev, lockedPanes: newLocked };
    });
  }, []);

  const setActiveTool = useCallback((tool: ActiveTool) => {
    setAnnotations({ activeTool: tool });
    // Close picker when switching away from arrow tool;
    // opening is handled by the arrow button click in ButtonPane
    if (tool !== "arrow") setArrowStylePickerOpen(false);
  }, []);

  return {
    settings,
    annotations,
    activeArrowStyle,
    setActiveArrowStyle,
    arrowStylePickerOpen,
    setArrowStylePickerOpen,
    selectedArrow,
    setSelectedArrow,
    toggleDarkMode,
    toggleLayersOn,
    toggleMultipleRowsLayout,
    togglePaneLocked,
    isPaneLocked,
    isAnyPaneLocked,
    reorderLockedPanes,
    toggleHideOffscreenArrows,
    toggleShowStatusBar,
    toggleOverscroll,
    toggleCommentPlacement,
    setActiveTool,
  };
}
