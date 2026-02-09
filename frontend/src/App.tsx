import { useRef, useCallback, Fragment } from "react";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { Divider } from "./components/ui/Divider";
import {
  TitleBar,
  SimpleEditorToolbar,
  EditorPane,
  SIMPLE_EDITOR_CONTENT,
} from "./components/tiptap-templates/simple";
import { useEditorWorkspace } from "./hooks/use-editor-workspace";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

export function App() {
  const workspace = useEditorWorkspace();
  const {
    settings,
    layers,
    activeLayerId,
    editorCount,
    activeEditor,
    editorWidths,
    isManagementPaneOpen,
    addHighlight,
    removeHighlight,
    editorsRef,
    sectionVisibility,
    handleDividerResize,
    handleEditorMount,
    handlePaneFocus,
  } = workspace;

  const containerRef = useRef<HTMLDivElement>(null);

  const handleWordClick = useCallback(
    (editorIndex: number, from: number, to: number, text: string) => {
      if (!activeLayerId) return;
      const layer = layers.find((l) => l.id === activeLayerId);
      const existing = layer?.highlights.find(
        (h) => h.editorIndex === editorIndex && h.from === from && h.to === to
      );
      if (existing) {
        removeHighlight(activeLayerId, existing.id);
      } else {
        addHighlight(activeLayerId, { editorIndex, from, to, text });
      }
    },
    [activeLayerId, layers, addHighlight, removeHighlight]
  );

  return (
    <WorkspaceProvider value={workspace}>
      <div className="flex h-screen">
        <ButtonPane />
        {isManagementPaneOpen && <ManagementPane />}
        <EditorContext.Provider value={{ editor: activeEditor }}>
          <div className="flex flex-col flex-1 min-w-0">
            <TitleBar />
            <SimpleEditorToolbar isLocked={settings.isLocked} />
            <div
              ref={containerRef}
              data-testid="editorContainer"
              className={`relative flex flex-1 min-w-0 min-h-0 ${settings.isMultipleRowsLayout ? "flex-col" : "flex-row"}`}
            >
              <CanvasOverlay
                layers={layers}
                containerRef={containerRef}
                editorsRef={editorsRef}
                editorCount={editorCount}
                isLocked={settings.isLocked}
                isLayersOn={settings.isLayersOn}
              />
              {editorWidths.map((width, i) => (
                <Fragment key={i}>
                  {i > 0 && sectionVisibility[i - 1] && sectionVisibility[i] && (
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
                    style={{
                      flex: `${width} 0 0%`,
                      display: sectionVisibility[i] === false ? "none" : undefined,
                    }}
                  >
                    <EditorPane
                      isLocked={settings.isLocked}
                      content={SIMPLE_EDITOR_CONTENT}
                      index={i}
                      onEditorMount={handleEditorMount}
                      onFocus={handlePaneFocus}
                      onWordClick={settings.isLocked && settings.isLayersOn ? handleWordClick : undefined}
                    />
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </EditorContext.Provider>
      </div>
    </WorkspaceProvider>
  );
}

export default App;
