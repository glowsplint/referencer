import {
  Sun,
  MoonStar,
  Columns2,
  Rows2,
  BoxSelect,
  Paintbrush,
  Lock,
  LockOpen,
  Menu,
} from "lucide-react";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";
import type { EditorSettings, AnnotationSettings } from "@/types/editor";

interface ButtonPaneProps {
  settings: EditorSettings;
  annotations: AnnotationSettings;
  isManagementPaneOpen: boolean;
  toggleManagementPane: () => void;
  toggleDarkMode: () => void;
  toggleEditorLayout: () => void;
  togglePainterMode: () => void;
  toggleLock: () => void;
}

export function ButtonPane({
  settings,
  annotations,
  isManagementPaneOpen,
  toggleManagementPane,
  toggleDarkMode,
  toggleEditorLayout,
  togglePainterMode,
  toggleLock,
}: ButtonPaneProps) {
  return (
    <div className="flex flex-col items-center gap-1 h-full p-1">
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
        callback={toggleEditorLayout}
        title="Toggle editor layout"
        buttonProps={{ "data-testid": "editorLayoutButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<BoxSelect size={20} />}
        iconTwo={<Paintbrush size={20} />}
        bool={annotations.isPainterMode}
        callback={togglePainterMode}
        title="Toggle Painter mode"
        buttonProps={{ "data-testid": "painterModeButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<LockOpen size={20} />}
        iconTwo={<Lock size={20} />}
        bool={settings.isLocked}
        callback={toggleLock}
        title="Toggle editor lock"
        buttonProps={{ "data-testid": "lockButton" }}
      />
    </div>
  );
}
