import { useRef, useEffect, useState, useCallback, Fragment } from "react";
import { EditorContext } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { Divider } from "./components/ui/Divider";
import {
  TitleBar,
  SimpleEditorToolbar,
  EditorPane,
  SIMPLE_EDITOR_CONTENT,
} from "./components/tiptap-templates/simple/simple-editor";

const MIN_EDITOR_PCT = 10;

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
  const [editorCount, setEditorCount] = useState(1);
  const [splitPositions, setSplitPositions] = useState<number[]>([]);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const editorsRef = useRef<Map<number, Editor>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.isDarkMode);
  }, [settings.isDarkMode]);

  const toggle = (key: keyof typeof settings) => () =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const addEditor = useCallback(() => {
    setEditorCount((count) => {
      if (count >= 3) return count;
      const newCount = count + 1;
      const positions = Array.from(
        { length: newCount - 1 },
        (_, i) => ((i + 1) / newCount) * 100,
      );
      setSplitPositions(positions);
      return newCount;
    });
  }, []);

  const handleDividerResize = useCallback((index: number, pct: number) => {
    setSplitPositions((positions) => {
      const newPositions = [...positions];
      const lower =
        index > 0 ? positions[index - 1] + MIN_EDITOR_PCT : MIN_EDITOR_PCT;
      const upper =
        index < positions.length - 1
          ? positions[index + 1] - MIN_EDITOR_PCT
          : 100 - MIN_EDITOR_PCT;
      newPositions[index] = Math.min(upper, Math.max(lower, pct));
      return newPositions;
    });
  }, []);

  const handleEditorMount = useCallback((index: number, editor: Editor) => {
    editorsRef.current.set(index, editor);
    if (index === 0) {
      setActiveEditor(editor);
    }
  }, []);

  const handlePaneFocus = useCallback((index: number) => {
    const editor = editorsRef.current.get(index);
    if (editor) {
      setActiveEditor(editor);
    }
  }, []);

  const editorWidths: number[] = [];
  for (let i = 0; i < editorCount; i++) {
    const start = i === 0 ? 0 : splitPositions[i - 1];
    const end = i === editorCount - 1 ? 100 : splitPositions[i];
    editorWidths.push(end - start);
  }

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
        addEditor={addEditor}
        editorCount={editorCount}
      />
      <EditorContext.Provider value={{ editor: activeEditor }}>
        <div className="flex flex-col flex-1 min-w-0">
          <TitleBar />
          <SimpleEditorToolbar isLocked={settings.isLocked} />
          <div
            ref={containerRef}
            className={`flex flex-1 min-w-0 min-h-0 ${settings.isMultipleRowsLayout ? "flex-col" : "flex-row"}`}
          >
            {editorWidths.map((width, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <Divider
                    onResize={(pct) => handleDividerResize(i - 1, pct)}
                    containerRef={containerRef}
                    direction={
                      settings.isMultipleRowsLayout ? "vertical" : "horizontal"
                    }
                  />
                )}
                <div
                  className="min-w-0 min-h-0 overflow-hidden"
                  style={{ flex: `${width} 0 0%` }}
                >
                  <EditorPane
                    isLocked={settings.isLocked}
                    content={SIMPLE_EDITOR_CONTENT}
                    index={i}
                    onEditorMount={handleEditorMount}
                    onFocus={handlePaneFocus}
                  />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </EditorContext.Provider>
    </div>
  );
}

export default App;
