import { useRef, useState, useCallback, useEffect, useMemo, Fragment, type RefObject } from "react";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { StatusBar } from "./components/StatusBar";
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
import { useCommentMode } from "./hooks/use-comment-mode";
import { useHighlightMode } from "./hooks/use-highlight-mode";
import { useUnderlineMode } from "./hooks/use-underline-mode";
import { useStatusMessage } from "./hooks/use-status-message";
import { useToolShortcuts } from "./hooks/use-tool-shortcuts";
import { useToggleShortcuts } from "./hooks/use-toggle-shortcuts";
import { useCycleLayer } from "./hooks/use-cycle-layer";
import { useDragSelection } from "./hooks/use-drag-selection";
import { useUndoRedoKeyboard } from "./hooks/use-undo-redo-keyboard";
import { useActionConsole } from "./hooks/use-action-console";
import { ToastKbd } from "./components/ui/ToastKbd";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { AnnotationPanel } from "./components/AnnotationPanel";
import { ActionConsole } from "./components/ActionConsole";
import { Toaster } from "./components/ui/sonner";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import type { EditingAnnotation } from "./types/editor";

function getWorkspaceId(): string {
  const path = window.location.pathname;
  const match = path.match(/^\/space\/(.+)$/);
  if (match) return match[1];

  // On /space with no id, generate one and redirect
  const id = crypto.randomUUID();
  window.history.replaceState(null, "", `/space/${id}`);
  return id;
}

function getReadOnly(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("access") === "readonly";
}

export function App() {
  const [workspaceId] = useState(getWorkspaceId);
  const [readOnly] = useState(getReadOnly);
  const workspace = useEditorWorkspace(workspaceId, readOnly);
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
    addLayer,
    addArrow,
    removeArrow,
    addUnderline,
    removeUnderline,
    editorsRef,
    editorKeys,
    sectionVisibility,
    handleDividerResize,
    handleEditorMount,
    handlePaneFocus,
    annotations,
    setActiveTool,
    history,
    updateEditorContent,
  } = workspace;

  useToolShortcuts({
    isLocked: settings.isLocked,
    setActiveTool,
    onArrowLongPress: useCallback(() => workspace.setArrowStylePickerOpen(true), [workspace]),
  });
  useToggleShortcuts({
    toggleDarkMode: workspace.toggleDarkMode,
    toggleMultipleRowsLayout: workspace.toggleMultipleRowsLayout,
    toggleLocked: workspace.toggleLocked,
    toggleManagementPane: workspace.toggleManagementPane,
  });
  useUndoRedoKeyboard(history);
  const actionConsole = useActionConsole();
  const { message: statusMessage, setStatus, clearStatus } = useStatusMessage();

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<EditingAnnotation | null>(null);
  const annotationBeforeEditRef = useRef<string>("");
  const confirmRef = useRef<() => void>(() => {}) as RefObject<() => void>;

  const { selection, selectionHidden, selectWord, selectRange, clearSelection, hideSelection } = useWordSelection({
    isLocked: settings.isLocked,
    editorsRef,
    containerRef,
    editorCount,
    onEnter: useCallback(() => confirmRef.current(), []),
    onEscape: useCallback(() => {
      setActiveTool("selection");
      workspace.setSelectedArrow(null);
    }, [setActiveTool, workspace]),
  });

  const { drawingState, confirmSelection } = useDrawingMode({
    isLocked: settings.isLocked,
    activeTool: annotations.activeTool,
    selection,
    activeLayerId,
    activeArrowStyle: workspace.activeArrowStyle,
    addLayer,
    addArrow,
    showDrawingToasts: settings.showDrawingToasts,
    setActiveTool,
    setStatus,
    clearStatus,
  });

  const { confirmComment } = useCommentMode({
    isLocked: settings.isLocked,
    activeTool: annotations.activeTool,
    selection,
    activeLayerId,
    addLayer,
    layers,
    addHighlight,
    removeHighlight,
    onHighlightAdded: useCallback((layerId: string, highlightId: string) => {
      annotationBeforeEditRef.current = "";
      setEditingAnnotation({ layerId, highlightId });
    }, []),
    showCommentToasts: settings.showCommentsToasts,
    setStatus,
    clearStatus,
  });

  const { confirmHighlight } = useHighlightMode({
    isLocked: settings.isLocked,
    activeTool: annotations.activeTool,
    selection,
    activeLayerId,
    addLayer,
    layers,
    addHighlight,
    removeHighlight,
    showHighlightToasts: settings.showHighlightToasts,
    setStatus,
    clearStatus,
  });

  const { confirmUnderline } = useUnderlineMode({
    isLocked: settings.isLocked,
    activeTool: annotations.activeTool,
    selection,
    activeLayerId,
    addLayer,
    layers,
    addUnderline,
    removeUnderline,
    showUnderlineToasts: settings.showHighlightToasts,
    setStatus,
    clearStatus,
  });

  // Hint to lock the editor when unlocked
  useEffect(() => {
    if (!settings.isLocked && !readOnly) {
      setStatus({ text: <>Press <ToastKbd>K</ToastKbd> to lock the editor once you've finalised the contents</>, type: "info" })
    }
  }, [settings.isLocked, readOnly, setStatus])

  // Default status message when locked with selection tool and no visible selection
  useEffect(() => {
    if (settings.isLocked && annotations.activeTool === "selection" && (!selection || selectionHidden)) {
      setStatus({ text: "Click a word or use arrow keys to navigate", type: "info" })
    }
  }, [settings.isLocked, annotations.activeTool, selection, selectionHidden, setStatus])

  // Mutual exclusivity: visible word selection clears arrow selection
  useEffect(() => {
    if (selection && !selectionHidden) {
      workspace.setSelectedArrow(null);
    }
  }, [selection, selectionHidden, workspace])

  confirmRef.current = () => {
    confirmSelection();
    confirmComment();
    confirmHighlight();
    confirmUnderline();
  };

  useCycleLayer({
    layers,
    activeLayerId,
    setActiveLayer,
  });

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDragSelection({
    isLocked: settings.isLocked,
    activeTool: annotations.activeTool,
    selectWord,
    selectRange,
    clearSelection,
  });

  // Mutual exclusivity: selecting an arrow hides word selection
  const handleSetSelectedArrow = useCallback(
    (arrow: { layerId: string; arrowId: string } | null) => {
      workspace.setSelectedArrow(arrow);
      if (arrow) hideSelection();
    },
    [workspace, hideSelection]
  );

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
          const truncated = (s: string) => s.length > 80 ? s.slice(0, 80) + "..." : s
          history.record({
            type: "updateAnnotation",
            description: `Updated annotation to '${truncated(annotation)}'`,
            details: [{ label: "annotation", before: truncated(oldText), after: truncated(annotation) }],
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
      <div className="flex flex-col h-screen">
      <div className="flex flex-1 min-h-0">
        <ButtonPane />
        {isManagementPaneOpen && <ManagementPane />}
        <EditorContext.Provider value={{ editor: activeEditor }}>
          <div className="flex flex-col flex-1 min-w-0">
            <TitleBar />
            <SimpleEditorToolbar isLocked={settings.isLocked} />
            <StatusBar message={statusMessage} />
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
                  selectedArrow={workspace.selectedArrow}
                  setSelectedArrow={handleSetSelectedArrow}
                  activeTool={annotations.activeTool}
                  sectionVisibility={sectionVisibility}
                  isDarkMode={settings.isDarkMode}
                  isLocked={settings.isLocked || readOnly}
                />
                {editorWidths.map((width, i) => {
                  const showDivider = i > 0 && sectionVisibility[i - 1] && sectionVisibility[i]
                  const dividerDirection = settings.isMultipleRowsLayout ? "vertical" as const : "horizontal" as const
                  return (
                  <Fragment key={editorKeys[i]}>
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
                        isLocked={settings.isLocked || readOnly}
                        activeTool={annotations.activeTool}
                        content={SIMPLE_EDITOR_CONTENT}
                        index={i}
                        onEditorMount={handleEditorMount}
                        onFocus={handlePaneFocus}
                        onMouseDown={settings.isLocked && !readOnly ? handleMouseDown : undefined}
                        onMouseMove={settings.isLocked && !readOnly ? handleMouseMove : undefined}
                        onMouseUp={settings.isLocked && !readOnly ? handleMouseUp : undefined}
                        onContentUpdate={readOnly ? undefined : updateEditorContent}
                        layers={layers}
                        selection={selection}
                        selectionHidden={selectionHidden}
                        activeLayerColor={activeLayerColor}
                        isDarkMode={settings.isDarkMode}
                        removeArrow={removeArrow}
                        sectionVisibility={sectionVisibility}
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
      <ActionConsole
        log={history.log}
        isOpen={actionConsole.isOpen}
        onClose={() => actionConsole.setIsOpen(false)}
        height={actionConsole.consoleHeight}
        onHeightChange={actionConsole.setConsoleHeight}
      />
      </div>
    </WorkspaceProvider>
  );
}

export default App;
