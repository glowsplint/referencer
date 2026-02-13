import { useState } from "react";
import {
  Columns2,
  Rows2,
  MousePointer2,
  Lock,
  LockOpen,
  Menu,
  ArrowBigRight,
  MessageSquareText,
  Keyboard,
  CircleHelp,
  Settings,
} from "lucide-react";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { FAQDialog } from "./FAQDialog";
import { SettingsDialog } from "./SettingsDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ActiveTool } from "@/types/editor";

export function ButtonPane() {
  const {
    settings,
    annotations,
    readOnly,
    isManagementPaneOpen,
    toggleManagementPane,
    toggleDarkMode,
    toggleMultipleRowsLayout,
    setActiveTool,
    toggleLocked,
    toggleShowDrawingToasts,
    toggleShowCommentsToasts,
  } = useWorkspace();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <button
        onClick={() => setFaqOpen(true)}
        title="Help & FAQ"
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        data-testid="faqButton"
      >
        <CircleHelp size={20} />
      </button>
      <button
        onClick={() => setSettingsOpen(true)}
        title="Settings"
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        data-testid="settingsButton"
      >
        <Settings size={20} />
      </button>
      <div className="w-6 border-t border-border" role="separator" />
      {/* Tools group */}
      {toolButtons.map(({ tool, icon, title, testId }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          title={title}
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
      ))}
      <div className="w-6 border-t border-border" role="separator" />
      {/* Settings group */}
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
        buttonProps={{ "data-testid": "lockButton", disabled: readOnly }}
      />
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
      />
    </div>
  );
}
