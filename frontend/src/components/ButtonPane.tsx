import {
  Sun,
  MoonStar,
  Layers,
  Columns2,
  Rows2,
  BoxSelect,
  Paintbrush,
  Lock,
  LockOpen,
} from "lucide-react";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";

interface ButtonPaneProps {
  settings: {
    isDarkMode: boolean;
    isLayersOn: boolean;
    isMultipleRowsLayout: boolean;
    isLocked: boolean;
  };
  annotations: {
    isPainterMode: boolean;
  };
  toggleDarkMode: () => void;
  toggleLayers: () => void;
  toggleEditorLayout: () => void;
  togglePainterMode: () => void;
  toggleLock: () => void;
}

export function ButtonPane({
  settings,
  annotations,
  toggleDarkMode,
  toggleLayers,
  toggleEditorLayout,
  togglePainterMode,
  toggleLock,
}: ButtonPaneProps) {
  return (
    <div className="flex flex-col items-center gap-1 h-full p-1">
      <SwitchingButtonIcon
        iconOne={<Sun size={20} />}
        iconTwo={<MoonStar size={20} />}
        bool={settings.isDarkMode}
        callback={toggleDarkMode}
        title="Toggle dark mode"
        buttonProps={{ "data-testid": "darkModeButton" }}
      />
      <SwitchingButtonIcon
        iconOne={<Layers size={20} />}
        iconTwo={<Layers size={20} />}
        bool={settings.isLayersOn}
        callback={toggleLayers}
        title="Toggle layer visibility"
        buttonProps={{ "data-testid": "clearLayersButton" }}
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
