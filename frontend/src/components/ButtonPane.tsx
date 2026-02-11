import { useState } from "react";
import {
  Sun,
  MoonStar,
  Columns2,
  Rows2,
  MousePointer2,
  Lock,
  LockOpen,
  Menu,
  ArrowBigRight,
  MessageSquareText,
  Keyboard,
} from "lucide-react";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ActiveTool } from "@/types/editor";

export function ButtonPane() {
  const {
    settings,
    annotations,
    isManagementPaneOpen,
    toggleManagementPane,
    toggleDarkMode,
    toggleMultipleRowsLayout,
    setActiveTool,
    toggleLocked,
  } = useWorkspace();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const toolButtons: { tool: ActiveTool; icon: React.ReactNode; title: string; testId: string }[] = [
    { tool: "selection", icon: <MousePointer2 size={20} />, title: "Selection tool", testId: "selectionToolButton" },
    { tool: "arrow", icon: <ArrowBigRight size={20} />, title: "Arrow tool", testId: "arrowToolButton" },
    { tool: "comments", icon: <MessageSquareText size={20} />, title: "Comments tool", testId: "commentsToolButton" },
  ];

  return (
    <div className="flex flex-col items-center gap-1 h-full p-1">
      {/* Meta group */}
      <SwitchingButtonIcon
        iconOne={<Menu size={20} />}
        iconTwo={<Menu size={20} />}
        bool={isManagementPaneOpen}
        callback={toggleManagementPane}
        title="Toggle management pane"
        buttonProps={{ "data-testid": "menuButton" }}
      />
      <button
        onClick={() => setShortcutsOpen(true)}
        title="Keyboard shortcuts"
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        data-testid="keyboardShortcutsButton"
      >
        <Keyboard size={20} />
      </button>
      <div className="w-6 border-t border-border" role="separator" />
      {/* Tools group */}
      {toolButtons.map(({ tool, icon, title, testId }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          title={title}
          disabled={!settings.isLocked}
          className={`p-2 rounded-md transition-colors ${
            annotations.activeTool === tool && settings.isLocked
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none"
          }`}
          data-testid={testId}
        >
          {icon}
        </button>
      ))}
      <div className="w-6 border-t border-border" role="separator" />
      {/* Settings group */}
      <SwitchingButtonIcon
        iconOne={<MoonStar size={20} />}
        iconTwo={<Sun size={20} />}
        bool={settings.isDarkMode}
        callback={toggleDarkMode}
        title="Toggle dark mode"
        buttonProps={{ "data-testid": "darkModeButton" }}
      />
      <SwitchingButtonIcon
        iconTwo={<Columns2 size={20} />}
        iconOne={<Rows2 size={20} />}
        bool={settings.isMultipleRowsLayout}
        callback={toggleMultipleRowsLayout}
        title="Toggle editor layout"
        buttonProps={{ "data-testid": "editorLayoutButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<Lock size={20} />}
        iconTwo={<LockOpen size={20} />}
        bool={settings.isLocked}
        callback={toggleLocked}
        title="Toggle editor lock"
        buttonProps={{ "data-testid": "lockButton" }}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  );
}
