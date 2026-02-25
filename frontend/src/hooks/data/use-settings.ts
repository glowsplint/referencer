// Manages all UI settings (dark mode, layout, lock state) persisted to
// localStorage. Also tracks transient annotation state like the active tool,
// arrow style picker, and selected arrow.
import { useEffect, useState, useCallback } from "react";
import type { EditorSettings, AnnotationSettings, ActiveTool, ArrowStyle } from "@/types/editor";
import { STORAGE_KEYS } from "@/constants/storage-keys";

const DEFAULT_SETTINGS: EditorSettings = {
  isDarkMode: false,
  isLayersOn: false,
  isMultipleRowsLayout: false,
  isLocked: true,
  overscrollEnabled: false,
  hideOffscreenArrows: false,
  showStatusBar: true,
  commentPlacement: "right",
};

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
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
    } catch { /* quota exceeded or unavailable */ }
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode);
  }, [settings.isDarkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("overscroll-enabled", settings.overscrollEnabled);
  }, [settings.overscrollEnabled]);

  const toggleDarkMode = useToggle(setSettings, "isDarkMode");
  const toggleLayersOn = useToggle(setSettings, "isLayersOn");
  const toggleMultipleRowsLayout = useToggle(setSettings, "isMultipleRowsLayout");
  const toggleLocked = useToggle(setSettings, "isLocked");
  const toggleOverscrollEnabled = useToggle(setSettings, "overscrollEnabled");
  const toggleHideOffscreenArrows = useToggle(setSettings, "hideOffscreenArrows");
  const toggleShowStatusBar = useToggle(setSettings, "showStatusBar");
  const toggleCommentPlacement = useCallback(
    () =>
      setSettings((prev) => ({
        ...prev,
        commentPlacement: prev.commentPlacement === "right" ? "left" : "right",
      })),
    [],
  );
  const setActiveTool = useCallback((tool: ActiveTool) => setAnnotations({ activeTool: tool }), []);

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
    toggleLocked,
    toggleOverscrollEnabled,
    toggleHideOffscreenArrows,
    toggleShowStatusBar,
    toggleCommentPlacement,
    setActiveTool,
  };
}
