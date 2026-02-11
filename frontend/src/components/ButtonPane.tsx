import { useState } from "react";
import {
  Sun,
  MoonStar,
  Columns2,
  Rows2,
  MousePointer2,
  Paintbrush,
  Lock,
  LockOpen,
  Menu,
  ArrowUpRight,
  Keyboard,
} from "lucide-react";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface ButtonPaneProps {
  isDrawing?: boolean;
}

export function ButtonPane({ isDrawing = false }: ButtonPaneProps) {
  const {
    settings,
    annotations,
    isManagementPaneOpen,
    toggleManagementPane,
    toggleDarkMode,
    toggleMultipleRowsLayout,
    togglePainterMode,
    toggleLocked,
  } = useWorkspace();

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const painterIcon = isDrawing
    ? <ArrowUpRight size={20} />
    : annotations.isPainterMode
      ? <Paintbrush size={20} />
      : <MousePointer2 size={20} />;

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
      <button
        onClick={togglePainterMode}
        title="Toggle Painter mode"
        className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        data-testid="painterModeButton"
      >
        {painterIcon}
      </button>
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
