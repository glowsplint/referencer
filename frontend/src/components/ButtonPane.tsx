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
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function ButtonPane() {
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
        callback={toggleMultipleRowsLayout}
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
        iconOne={<Lock size={20} />}
        iconTwo={<LockOpen size={20} />}
        bool={settings.isLocked}
        callback={toggleLocked}
        title="Toggle editor lock"
        buttonProps={{ "data-testid": "lockButton" }}
      />
    </div>
  );
}
