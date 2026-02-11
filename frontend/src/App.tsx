import { useRef, useState, useCallback, Fragment } from "react";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { Divider } from "./components/ui/Divider";
import {
  TitleBar,
  SimpleEditorToolbar,
  EditorPane,
  SIMPLE_EDITOR_CONTENT,
} from "./components/tiptap-templates/simple";
import { useEditorWorkspace } from "./hooks/use-editor-workspace";
import { useWordSelection } from "./hooks/use-word-selection";
import { useDrawingMode } from "./hooks/use-drawing-mode";
import { useCycleLayer } from "./hooks/use-cycle-layer";
import { useDragSelection } from "./hooks/use-drag-selection";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { Toaster } from "./components/ui/sonner";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import type { EditingAnnotation } from "./types/editor";

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
    setActiveLayer,
    addHighlight,
    removeHighlight,
    updateHighlightAnnotation,
    addArrow,
    removeArrow,
    editorsRef,
    sectionVisibility,
    handleDividerResize,
    handleEditorMount,
    handlePaneFocus,
  } = workspace;

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<EditingAnnotation | null>(null);

  const { selection, selectWord, clearSelection } = useWordSelection({
    isLocked: settings.isLocked,
    editorsRef,
    containerRef,
    editorCount,
  });

  const { drawingState, isDrawing } = useDrawingMode({
    isLocked: settings.isLocked,
    selection,
    activeLayerId,
    addArrow,
  });

  useCycleLayer({
    layers,
    activeLayerId,
    setActiveLayer,
  });

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDragSelection({
    isLocked: settings.isLocked,
    activeLayerId,
    addHighlight,
    removeHighlight,
    layers,
    selectWord,
    clearSelection,
  });

  const activeLayerColor = activeLayerId
    ? layers.find((l) => l.id === activeLayerId)?.color ?? null
    : null;

  const handleAnnotationChange = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      updateHighlightAnnotation(layerId, highlightId, annotation);
    },
    [updateHighlightAnnotation]
  );

  const handleAnnotationBlur = useCallback(() => {
    setEditingAnnotation(null);
  }, []);

  const handleAnnotationClick = useCallback(
    (layerId: string, highlightId: string) => {
      setEditingAnnotation({ layerId, highlightId });
    },
    []
  );

  return (
    <WorkspaceProvider value={workspace}>
      <Toaster />
      <div className="flex h-screen">
        <ButtonPane isDrawing={isDrawing} />
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
              <ArrowOverlay
                layers={layers}
                drawingState={drawingState}
                drawingColor={activeLayerColor}
                editorsRef={editorsRef}
                containerRef={containerRef}
                removeArrow={removeArrow}
                sectionVisibility={sectionVisibility}
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
                      onMouseDown={settings.isLocked ? handleMouseDown : undefined}
                      onMouseMove={settings.isLocked ? handleMouseMove : undefined}
                      onMouseUp={settings.isLocked ? handleMouseUp : undefined}
                      layers={layers}
                      selection={selection}
                      editingAnnotation={editingAnnotation}
                      onAnnotationChange={handleAnnotationChange}
                      onAnnotationBlur={handleAnnotationBlur}
                      onAnnotationClick={handleAnnotationClick}
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
