import { useEffect, useState } from "react";
import { ButtonPane } from "./components/ButtonPane";
import { SimpleEditor } from "./components/tiptap-templates/simple/simple-editor";

export function App() {
  const [settings, setSettings] = useState({
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
  });
  const [annotations, setAnnotations] = useState({
    isPainterMode: false,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode);
  }, [settings.isDarkMode]);

  const toggle = (key: keyof typeof settings) => () =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="flex h-screen">
      <ButtonPane
        settings={settings}
        annotations={annotations}
        toggleDarkMode={toggle("isDarkMode")}
        toggleLayers={toggle("isLayersOn")}
        toggleEditorLayout={toggle("isMultipleRowsLayout")}
        togglePainterMode={() =>
          setAnnotations((a) => ({ ...a, isPainterMode: !a.isPainterMode }))
        }
        toggleLock={toggle("isLocked")}
      />
      <div className="flex-1 min-w-0">
        <SimpleEditor isLocked={settings.isLocked} />
      </div>
    </div>
  );
}

export default App;
