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
  FilePlusCorner,
} from "lucide-react";
import { ButtonIcon } from "./ui/ButtonIcon";
import { SwitchingButtonIcon } from "./ui/SwitchingButtonIcon";
import type { EditorSettings, AnnotationSettings } from "@/types/editor";

interface ButtonPaneProps {
  settings: EditorSettings;
  annotations: AnnotationSettings;
  toggleDarkMode: () => void;
  toggleLayers: () => void;
  toggleEditorLayout: () => void;
  togglePainterMode: () => void;
  toggleLock: () => void;
  addEditor: () => void;
  editorCount: number;
}

export function ButtonPane({
  settings,
  annotations,
  toggleDarkMode,
  toggleLayers,
  toggleEditorLayout,
  togglePainterMode,
  toggleLock,
  addEditor,
  editorCount,
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
      <ButtonIcon
        icon={<FilePlusCorner size={20} />}
        callback={addEditor}
        disabled={editorCount >= 3}
        title="Add new section"
        buttonProps={{ "data-testid": "addEditorButton" }}
      />
    </div>
  );
}
