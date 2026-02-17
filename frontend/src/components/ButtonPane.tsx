// Vertical toolbar on the left edge of the workspace. Contains meta actions
// (management pane toggle, keyboard shortcuts, FAQ, settings), annotation tools
// (selection, arrow, highlight, comments, underline, eraser), and layout/lock
// toggles. Tool buttons are disabled when the editor is unlocked or read-only.
import { useState, useCallback, useEffect } from "react";
import {
  Columns2,
  Rows2,
  MousePointer2,
  Lock,
  LockOpen,
  Menu,
  MessageSquareText,
  Highlighter,
  Underline,
  Eraser,
  Keyboard,
  CircleHelp,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { FAQDialog } from "./FAQDialog";
import { SettingsDialog } from "./SettingsDialog";
import { ArrowStylePicker } from "./ArrowStylePicker";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ActiveTool, ArrowStyle } from "@/types/editor";

const TOOL_SHORTCUTS: Record<ActiveTool, string> = {
  selection: "S",
  arrow: "A",
  comments: "C",
  highlight: "H",
  underline: "U",
  eraser: "E",
};

function ArrowStyleIcon({ style, size = 20 }: { style: ArrowStyle; size?: number }) {
  const pad = 3;
  const mid = size / 2;
  const right = size - pad;
  const arrowSize = 4;
  if (style === "double") {
    const gap = 2;
    const lineEnd = right - arrowSize;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1={pad} y1={mid - gap} x2={lineEnd} y2={mid - gap} />
        <line x1={pad} y1={mid + gap} x2={lineEnd} y2={mid + gap} />
        <polyline points={`${right - arrowSize},${mid - arrowSize} ${right},${mid} ${right - arrowSize},${mid + arrowSize}`} />
      </svg>
    );
  }
  const dasharray =
    style === "dashed" ? "4 2.5" : style === "dotted" ? "1.5 2.5" : undefined;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1={pad} y1={mid} x2={right} y2={mid} strokeDasharray={dasharray} />
      <polyline points={`${right - arrowSize},${mid - arrowSize} ${right},${mid} ${right - arrowSize},${mid + arrowSize}`} strokeDasharray={undefined} />
    </svg>
  );
}

export function ButtonPane() {
  const {
    settings,
    annotations,
    readOnly,
    activeArrowStyle,
    setActiveArrowStyle,
    arrowStylePickerOpen,
    setArrowStylePickerOpen,
    selectedArrow,
    updateArrowStyle,
    isManagementPaneOpen,
    toggleManagementPane,
    toggleDarkMode,
    toggleMultipleRowsLayout,
    setActiveTool,
    toggleLocked,
    toggleShowDrawingToasts,
    toggleShowCommentsToasts,
    toggleShowHighlightToasts,
    toggleOverscrollEnabled,
  } = useWorkspace();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync picker open state with active tool
  useEffect(() => {
    setArrowStylePickerOpen(annotations.activeTool === "arrow");
  }, [annotations.activeTool, setArrowStylePickerOpen]);

  // Activate arrow tool when an arrow is selected
  useEffect(() => {
    if (selectedArrow) {
      setActiveTool("arrow");
    }
  }, [selectedArrow, setActiveTool]);

  const handleArrowStyleSelect = useCallback(
    (style: ArrowStyle) => {
      setActiveArrowStyle(style);
      if (selectedArrow) {
        updateArrowStyle(selectedArrow.layerId, selectedArrow.arrowId, style);
      }
    },
    [setActiveArrowStyle, selectedArrow, updateArrowStyle]
  );

  const toolButtons: { tool: ActiveTool; icon: React.ReactNode; label: string; testId: string }[] = [
    { tool: "selection", icon: <MousePointer2 size={20} />, label: "Selection tool", testId: "selectionToolButton" },
    { tool: "arrow", icon: <ArrowStyleIcon style={activeArrowStyle} />, label: "Arrow tool", testId: "arrowToolButton" },
    { tool: "highlight", icon: <Highlighter size={20} />, label: "Highlight tool", testId: "highlightToolButton" },
    { tool: "comments", icon: <MessageSquareText size={20} />, label: "Comments tool", testId: "commentsToolButton" },
    { tool: "underline", icon: <Underline size={20} />, label: "Underline tool", testId: "underlineToolButton" },
    { tool: "eraser", icon: <Eraser size={20} />, label: "Eraser tool", testId: "eraserToolButton" },
  ];

  return (
    <div className="flex flex-col items-center gap-1 h-full p-1" data-testid="buttonPane">
      {/* Meta group */}
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <SwitchingButtonIcon
            iconOne={<Menu size={20} />}
            iconTwo={<Menu size={20} />}
            bool={isManagementPaneOpen}
            callback={toggleManagementPane}
            buttonProps={{ "data-testid": "menuButton" }}
          />
        </TooltipTrigger>
        <TooltipContent>Toggle management pane <kbd>M</kbd></TooltipContent>
      </Tooltip>
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <button
            onClick={() => setShortcutsOpen(true)}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="keyboardShortcutsButton"
          >
            <Keyboard size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Keyboard shortcuts</TooltipContent>
      </Tooltip>
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <button
            onClick={() => setFaqOpen(true)}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="faqButton"
          >
            <CircleHelp size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Help & FAQ</TooltipContent>
      </Tooltip>
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="settingsButton"
          >
            <Settings size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
      <div className="w-6 border-t border-border" role="separator" />
      {/* Tools group */}
      {toolButtons.map(({ tool, icon, label, testId }) => {
        const isArrow = tool === "arrow";
        return (
          <div key={tool} className="relative">
            <Tooltip placement="right">
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(tool)}
                  disabled={!settings.isLocked || readOnly}
                  className={`p-2 rounded-md transition-colors ${
                    annotations.activeTool === tool && settings.isLocked
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none"
                  }`}
                  data-testid={testId}
                >
                  {icon}
                </button>
              </TooltipTrigger>
              <TooltipContent>{label} <kbd>{TOOL_SHORTCUTS[tool]}</kbd></TooltipContent>
            </Tooltip>
            {isArrow && arrowStylePickerOpen && (
              <div className="absolute left-full top-0 ml-1 z-50" data-testid="arrowStylePopover">
                <ArrowStylePicker
                  index={-1}
                  activeStyle={activeArrowStyle}
                  color="currentColor"
                  onSelectStyle={handleArrowStyleSelect}
                />
              </div>
            )}
          </div>
        );
      })}
      <div className="w-6 border-t border-border" role="separator" />
      {/* Settings group */}
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <SwitchingButtonIcon
            iconTwo={<Columns2 size={20} />}
            iconOne={<Rows2 size={20} />}
            bool={settings.isMultipleRowsLayout}
            callback={toggleMultipleRowsLayout}
            buttonProps={{ "data-testid": "editorLayoutButton" }}
          />
        </TooltipTrigger>
        <TooltipContent>Toggle editor layout <kbd>R</kbd></TooltipContent>
      </Tooltip>
      <Tooltip placement="right">
        <TooltipTrigger asChild>
          <SwitchingButtonIcon
            iconOne={<Lock size={20} />}
            iconTwo={<LockOpen size={20} />}
            bool={settings.isLocked}
            callback={toggleLocked}
            buttonProps={{ "data-testid": "lockButton", disabled: readOnly }}
          />
        </TooltipTrigger>
        <TooltipContent>Toggle editor lock <kbd>K</kbd></TooltipContent>
      </Tooltip>
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      <FAQDialog open={faqOpen} onOpenChange={setFaqOpen} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isDarkMode={settings.isDarkMode}
        toggleDarkMode={toggleDarkMode}
        showDrawingToasts={settings.showDrawingToasts}
        toggleShowDrawingToasts={toggleShowDrawingToasts}
        showCommentsToasts={settings.showCommentsToasts}
        toggleShowCommentsToasts={toggleShowCommentsToasts}
        showHighlightToasts={settings.showHighlightToasts}
        toggleShowHighlightToasts={toggleShowHighlightToasts}
        overscrollEnabled={settings.overscrollEnabled}
        toggleOverscrollEnabled={toggleOverscrollEnabled}
      />
    </div>
  );
}
