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
  ArrowUpRight,
  MessageSquare,
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
    { tool: "arrow", icon: <ArrowUpRight size={20} />, title: "Arrow tool", testId: "arrowToolButton" },
    { tool: "comments", icon: <MessageSquare size={20} />, title: "Comments tool", testId: "commentsToolButton" },
  ];

  return (
    <div className="flex flex-col items-center gap-1 h-full p-1">
      <button
        onClick={() => setShortcutsOpen(true)}
        title="Keyboard shortcuts"
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        data-testid="keyboardShortcutsButton"
      >
        <Keyboard size={20} />
      </button>
      {toolButtons.map(({ tool, icon, title, testId }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          title={title}
          className={`p-2 rounded-md transition-colors ${
            annotations.activeTool === tool
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
          data-testid={testId}
        >
          {icon}
        </button>
      ))}
      <SwitchingButtonIcon
        iconOne={<Menu size={20} />}
        iconTwo={<Menu size={20} />}
        bool={isManagementPaneOpen}
        callback={toggleManagementPane}
        title="Toggle management pane"
        buttonProps={{ "data-testid": "menuButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<Sun size={20} />}
        iconTwo={<MoonStar size={20} />}
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
