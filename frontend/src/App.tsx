import { useRef, useState, useCallback, useMemo, Fragment } from "react";
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
import { useUndoRedoKeyboard } from "./hooks/use-undo-redo-keyboard";
import { useActionConsole } from "./hooks/use-action-console";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { AnnotationPanel } from "./components/AnnotationPanel";
import { ActionConsole } from "./components/ActionConsole";
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
    history,
  } = workspace;

  useUndoRedoKeyboard(history);
  const actionConsole = useActionConsole();

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<EditingAnnotation | null>(null);
  const annotationBeforeEditRef = useRef<string>("");

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
    onHighlightAdded: useCallback((layerId: string, highlightId: string) => {
      annotationBeforeEditRef.current = "";
      setEditingAnnotation({ layerId, highlightId });
    }, []),
  });

  const activeLayerColor = activeLayerId
    ? layers.find((l) => l.id === activeLayerId)?.color ?? null
    : null;

  const handleAnnotationBlur = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      if (!annotation.trim()) {
        removeHighlight(layerId, highlightId);
      } else {
        const oldText = annotationBeforeEditRef.current;
        if (oldText !== annotation) {
          history.record({
            type: "updateAnnotation",
            description: "Updated annotation",
            undo: () => {
              updateHighlightAnnotation(layerId, highlightId, oldText);
            },
            redo: () => {
              updateHighlightAnnotation(layerId, highlightId, annotation);
            },
          });
        }
      }
      setEditingAnnotation(null);
    },
    [removeHighlight, history, updateHighlightAnnotation]
  );

  const handleAnnotationClick = useCallback(
    (layerId: string, highlightId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      const highlight = layer?.highlights.find((h) => h.id === highlightId);
      annotationBeforeEditRef.current = highlight?.annotation ?? "";
      setEditingAnnotation({ layerId, highlightId });
    },
    [layers]
  );

  const hasAnyAnnotations = useMemo(
    () => layers.some((l) => l.visible && l.highlights.some(
      (h) => sectionVisibility[h.editorIndex] !== false
    )),
    [layers, sectionVisibility]
  );

  return (
    <WorkspaceProvider value={workspace}>
      <Toaster />
      <ActionConsole
        log={history.log}
        isOpen={actionConsole.isOpen}
        onClose={() => actionConsole.setIsOpen(false)}
      />
      <div className="flex h-screen">
        <ButtonPane isDrawing={isDrawing} />
        {isManagementPaneOpen && <ManagementPane />}
        <EditorContext.Provider value={{ editor: activeEditor }}>
          <div className="flex flex-col flex-1 min-w-0">
            <TitleBar />
            <SimpleEditorToolbar isLocked={settings.isLocked} />
            <div className="flex flex-1 min-w-0 min-h-0">
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
                  isDarkMode={settings.isDarkMode}
                />
                {editorWidths.map((width, i) => {
                  const showDivider = i > 0 && sectionVisibility[i - 1] && sectionVisibility[i]
                  const dividerDirection = settings.isMultipleRowsLayout ? "vertical" as const : "horizontal" as const
                  return (
                  <Fragment key={i}>
                    {showDivider && (
                      <Divider
                        onResize={(pct) => handleDividerResize(i - 1, pct)}
                        containerRef={containerRef}
                        direction={dividerDirection}
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
                        activeLayerColor={activeLayerColor}
                        isDarkMode={settings.isDarkMode}
                      />
                    </div>
                  </Fragment>
                  )
                })}
              </div>
              {settings.isLocked && hasAnyAnnotations && (
                <AnnotationPanel
                  layers={layers}
                  editorsRef={editorsRef}
                  containerRef={containerRef}
                  editingAnnotation={editingAnnotation}
                  onAnnotationChange={updateHighlightAnnotation}
                  onAnnotationBlur={handleAnnotationBlur}
                  onAnnotationClick={handleAnnotationClick}
                  isDarkMode={settings.isDarkMode}
                  sectionVisibility={sectionVisibility}
                />
              )}
            </div>
          </div>
        </EditorContext.Provider>
      </div>
    </WorkspaceProvider>
  );
}

export default App;
