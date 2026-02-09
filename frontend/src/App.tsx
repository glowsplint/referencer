import { useRef, Fragment } from "react";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { Divider } from "./components/ui/Divider";
import {
  TitleBar,
  SimpleEditorToolbar,
  EditorPane,
  SIMPLE_EDITOR_CONTENT,
} from "./components/tiptap-templates/simple";
import { useEditorWorkspace } from "./hooks/use-editor-workspace";

export function App() {
  const {
    settings,
    annotations,
    editorCount,
    activeEditor,
    editorWidths,
    toggleSetting,
    togglePainterMode,
    addEditor,
    handleDividerResize,
    handleEditorMount,
    handlePaneFocus,
  } = useEditorWorkspace();

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen">
      <ButtonPane
        settings={settings}
        annotations={annotations}
        toggleDarkMode={toggleSetting("isDarkMode")}
        toggleLayers={toggleSetting("isLayersOn")}
        toggleEditorLayout={toggleSetting("isMultipleRowsLayout")}
        togglePainterMode={togglePainterMode}
        toggleLock={toggleSetting("isLocked")}
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
