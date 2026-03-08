// Manages all UI settings (theme, layout, lock state) persisted to
// localStorage. Also tracks transient annotation state like the active tool,
// arrow style picker, and selected arrow.
import { useEffect, useState, useCallback, useMemo } from "react";
import type {
  EditorSettings,
  AnnotationSettings,
  ActiveTool,
  ArrowStyle,
  Theme,
} from "@/types/editor";
import { STORAGE_KEYS } from "@/constants/storage-keys";

const THEME_ORDER: Theme[] = ["auto", "light", "dark", "sepia", "high-contrast"];

const DEFAULT_LOCKED_PANES: Record<number, boolean> = { 0: true, 1: true, 2: true, 3: true };

const DEFAULT_SETTINGS: EditorSettings = {
  theme: "auto",
  isLayersOn: false,
  isMultipleRowsLayout: false,
  lockedPanes: DEFAULT_LOCKED_PANES,
  hideOffscreenArrows: false,
  showStatusBar: true,
  overscroll: true,
  commentPlacement: "right",
  reduceMotion: "auto",
  hideAnnotations: false,
};

function getSystemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function applyReduceMotionToDOM(reduceMotion: "auto" | "on" | "off", systemReduced: boolean) {
  const reduced = reduceMotion === "on" || (reduceMotion === "auto" && systemReduced);
  document.documentElement.setAttribute("data-reduce-motion", reduced ? "reduce" : "no-preference");
}

/** Resolve what theme "auto" actually maps to based on OS preference. */
function resolveTheme(theme: Theme): Exclude<Theme, "auto"> {
  if (theme === "auto") return getSystemDark() ? "dark" : "light";
  return theme;
}

/** Determine whether this resolved theme should use the `.dark` CSS class. */
function isDarkVariant(resolved: Exclude<Theme, "auto">): boolean {
  return resolved === "dark" || resolved === "high-contrast";
}

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
    // Migrate old `isDarkMode: boolean` to `theme`
    if ("isDarkMode" in parsed && !("theme" in parsed)) {
      parsed.theme = parsed.isDarkMode ? "dark" : "auto";
      delete parsed.isDarkMode;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyThemeToDOM(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", isDarkVariant(resolved));
  document.documentElement.setAttribute("data-theme", resolved);
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
  // Track OS-level dark preference changes for auto theme
  const [systemDark, setSystemDark] = useState(getSystemDark);
  // Track OS-level reduced motion preference
  const [systemReducedMotion, setSystemReducedMotion] = useState(getSystemReducedMotion);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      /* quota exceeded or unavailable */
    }
  }, [settings]);

  // Apply theme to DOM whenever it changes or system preference changes
  useEffect(() => {
    applyThemeToDOM(settings.theme);
  }, [settings.theme, systemDark]);

  // Listen for OS prefers-color-scheme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Listen for OS prefers-reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setSystemReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply reduce motion to DOM whenever setting or system preference changes
  useEffect(() => {
    applyReduceMotionToDOM(settings.reduceMotion, systemReducedMotion);
  }, [settings.reduceMotion, systemReducedMotion]);

  // Computed: resolved theme (what auto actually resolves to).
  // `systemDark` is intentionally included — when theme is "auto", a change in
  // OS preference must trigger re-resolution.
  const resolvedTheme = useMemo(
    () => resolveTheme(settings.theme),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.theme, systemDark],
  );

  // Computed: backward-compat isDarkMode
  const isDarkMode = useMemo(() => isDarkVariant(resolvedTheme), [resolvedTheme]);

  const setTheme = useCallback((theme: Theme) => setSettings((prev) => ({ ...prev, theme })), []);

  const cycleTheme = useCallback(
    () =>
      setSettings((prev) => {
        const idx = THEME_ORDER.indexOf(prev.theme);
        const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
        return { ...prev, theme: next };
      }),
    [],
  );

  const toggleLayersOn = useToggle(setSettings, "isLayersOn");
  const toggleMultipleRowsLayout = useToggle(setSettings, "isMultipleRowsLayout");
  const toggleHideOffscreenArrows = useToggle(setSettings, "hideOffscreenArrows");
  const toggleShowStatusBar = useToggle(setSettings, "showStatusBar");
  const toggleOverscroll = useToggle(setSettings, "overscroll");
  const toggleHideAnnotations = useToggle(setSettings, "hideAnnotations");
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

  const setReduceMotion = useCallback(
    (value: "auto" | "on" | "off") => setSettings((prev) => ({ ...prev, reduceMotion: value })),
    [],
  );

  const setActiveTool = useCallback((tool: ActiveTool) => {
    setAnnotations({ activeTool: tool });
    // Close picker when switching away from arrow tool;
    // opening is handled by the arrow button click in ButtonPane
    if (tool !== "arrow") setArrowStylePickerOpen(false);
  }, []);

  return {
    settings,
    isDarkMode,
    resolvedTheme,
    annotations,
    activeArrowStyle,
    setActiveArrowStyle,
    arrowStylePickerOpen,
    setArrowStylePickerOpen,
    selectedArrow,
    setSelectedArrow,
    setTheme,
    cycleTheme,
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
    setReduceMotion,
    toggleHideAnnotations,
    setActiveTool,
  };
}
