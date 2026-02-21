// Root application component. Composes the multi-pane editor workspace:
// toolbar, management panel, editor panes with dividers, annotation panel,
// arrow overlay, and action console. Wires together all annotation tools
// (highlight, comment, underline, arrow, eraser) and keyboard navigation.
import { useRef, useState, useCallback, useEffect, useMemo, Fragment, type RefObject } from "react";
import { Trans } from "react-i18next";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { StatusBar } from "./components/StatusBar";
import { Divider } from "./components/ui/Divider";
import { TitleBar, SimpleEditorToolbar, EditorPane } from "./components/tiptap-templates/simple";
import { DEFAULT_PASSAGE_CONTENTS, PLACEHOLDER_CONTENT } from "./data/default-workspace";
import { useEditorWorkspace } from "./hooks/use-editor-workspace";
import { useWordSelection } from "./hooks/use-word-selection";
import { useDrawingMode } from "./hooks/use-drawing-mode";
import { useCommentMode } from "./hooks/use-comment-mode";
import { useHighlightMode } from "./hooks/use-highlight-mode";
import { useUnderlineMode } from "./hooks/use-underline-mode";
import { useEraserMode } from "./hooks/use-eraser-mode";
import { useStatusMessage } from "./hooks/use-status-message";
import { useToolShortcuts } from "./hooks/use-tool-shortcuts";
import { useToggleShortcuts } from "./hooks/use-toggle-shortcuts";
import { useCycleLayer } from "./hooks/use-cycle-layer";
import { useDragSelection } from "./hooks/use-drag-selection";
import { useUndoRedoKeyboard } from "./hooks/use-undo-redo-keyboard";
import { useActionConsole } from "./hooks/use-action-console";
import { useIsBreakpoint } from "./hooks/use-is-breakpoint";
import { useInlineEdit } from "./hooks/use-inline-edit";
import { ToastKbd } from "./components/ui/ToastKbd";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { AnnotationPanel } from "./components/AnnotationPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ActionConsole } from "./components/ActionConsole";
import { MobileInfoDialog } from "./components/MobileInfoDialog";
import { Toaster } from "./components/ui/sonner";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import type { EditingAnnotation } from "./types/editor";

function PassageHeader({
  name,
  index,
  onUpdateName,
}: {
  name: string;
  index: number;
  onUpdateName: (name: string) => void;
}) {
  const { isEditing, inputProps, startEditing } = useInlineEdit({
    currentName: name,
    onCommit: onUpdateName,
  });

  return (
    <div className="flex items-center px-3 py-1 border-b border-border bg-muted/30 shrink-0">
      {isEditing ? (
        <input
          {...inputProps}
          className="text-xs font-medium bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none w-full"
          data-testid={`passageHeaderInput-${index}`}
        />
      ) : (
        <span
          className="text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:underline decoration-muted-foreground/30 cursor-text rounded px-1"
          onDoubleClick={() => startEditing()}
          data-testid={`passageHeader-${index}`}
        >
          {name}
        </span>
      )}
    </div>
  );
}

// Extract workspace ID from hash-based route (e.g. "#/{uuid}?access=readonly").
// Falls back to generating a new random UUID for fresh sessions.
function getWorkspaceId(): string {
  const hash = window.location.hash;
  const hashPath = hash.replace(/^#\/?/, "").split("?")[0];
  if (hashPath) return hashPath;
  return crypto.randomUUID();
}

function getReadOnly(): boolean {
  const hash = window.location.hash;
  const qs = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
  return new URLSearchParams(qs).get("access") === "readonly";
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
    unifiedUndo,
    updateEditorContent,
  } = workspace;

  const isMobile = useIsBreakpoint("max", 768);
  const effectiveReadOnly = readOnly || isMobile;
  const [mobileDialogDismissed, setMobileDialogDismissed] = useState(false);

  useToolShortcuts({
    isLocked: settings.isLocked,
    setActiveTool,
  });
  useToggleShortcuts({
    toggleDarkMode: workspace.toggleDarkMode,
    toggleMultipleRowsLayout: workspace.toggleMultipleRowsLayout,
    toggleLocked: workspace.toggleLocked,
    toggleManagementPane: workspace.toggleManagementPane,
  });
  useUndoRedoKeyboard(unifiedUndo);
  const actionConsole = useActionConsole();
  const { message: statusMessage, setStatus, flashStatus, clearStatus } = useStatusMessage();

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<EditingAnnotation | null>(null);
  const annotationBeforeEditRef = useRef<string>("");
  const confirmRef = useRef<() => void>(() => {}) as RefObject<() => void>;

  const { selection, selectionHidden, selectWord, selectRange, clearSelection, hideSelection } =
    useWordSelection({
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
    setStatus,
    flashStatus,
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
    flashStatus,
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
    flashStatus,
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
    flashStatus,
    clearStatus,
  });

  const { confirmErase, eraseAtPosition } = useEraserMode({
    isLocked: settings.isLocked,
    activeTool: annotations.activeTool,
    selection,
    layers,
    removeHighlight,
    removeUnderline,
    removeArrow,
    setStatus,
    flashStatus,
    clearStatus,
  });

  // Hint to lock the editor when unlocked
  useEffect(() => {
    if (!settings.isLocked && !effectiveReadOnly) {
      setStatus({
        text: <Trans ns="tools" i18nKey="lockHint" components={{ kbd: <ToastKbd>_</ToastKbd> }} />,
        type: "info",
      });
    }
  }, [settings.isLocked, effectiveReadOnly, setStatus]);

  // Default status message when locked with selection tool and no visible selection
  useEffect(() => {
    if (
      settings.isLocked &&
      annotations.activeTool === "selection" &&
      (!selection || selectionHidden)
    ) {
      setStatus({ text: <Trans ns="tools" i18nKey="selection.defaultStatus" />, type: "info" });
    }
  }, [settings.isLocked, annotations.activeTool, selection, selectionHidden, setStatus]);

  // Mutual exclusivity: visible word selection clears arrow selection
  useEffect(() => {
    if (selection && !selectionHidden) {
      workspace.setSelectedArrow(null);
    }
  }, [selection, selectionHidden, workspace]);

  confirmRef.current = () => {
    confirmSelection();
    confirmComment();
    confirmHighlight();
    confirmUnderline();
    confirmErase();
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
    eraseAtPosition,
  });

  // Mutual exclusivity: selecting an arrow hides word selection
  const handleSetSelectedArrow = useCallback(
    (arrow: { layerId: string; arrowId: string } | null) => {
      workspace.setSelectedArrow(arrow);
      if (arrow) hideSelection();
    },
    [workspace, hideSelection],
  );

  const activeLayerColor = activeLayerId
    ? (layers.find((l) => l.id === activeLayerId)?.color ?? null)
    : null;

  const handleAnnotationBlur = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      if (!annotation.trim()) {
        removeHighlight(layerId, highlightId);
      } else {
        const oldText = annotationBeforeEditRef.current;
        if (oldText !== annotation) {
          const truncated = (s: string) => (s.length > 80 ? s.slice(0, 80) + "..." : s);
          history.record({
            type: "updateAnnotation",
            description: `Updated annotation to '${truncated(annotation)}'`,
            details: [
              { label: "annotation", before: truncated(oldText), after: truncated(annotation) },
            ],
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
    [removeHighlight, history, updateHighlightAnnotation],
  );

  const handleAnnotationClick = useCallback(
    (layerId: string, highlightId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      const highlight = layer?.highlights.find((h) => h.id === highlightId);
      annotationBeforeEditRef.current = highlight?.annotation ?? "";
      setEditingAnnotation({ layerId, highlightId });
    },
    [layers],
  );

  const hasAnyAnnotations = useMemo(
    () =>
      layers.some(
        (l) =>
          l.visible &&
          l.highlights.some(
            (h) => h.type === "comment" && sectionVisibility[h.editorIndex] !== false,
          ),
      ),
    [layers, sectionVisibility],
  );

  return (
    <WorkspaceProvider value={workspace}>
      <Toaster />
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex flex-1 min-h-0">
          {!isMobile && <ButtonPane />}
          {!isMobile && isManagementPaneOpen && <ManagementPane />}
          <EditorContext.Provider value={{ editor: activeEditor }}>
            <div className="flex flex-col flex-1 min-w-0">
              <TitleBar />
              <SimpleEditorToolbar isLocked={settings.isLocked} />
              {!isMobile && <StatusBar message={statusMessage} />}
              <div className="flex flex-1 min-w-0 min-h-0">
                <div
                  ref={containerRef}
                  data-testid="editorContainer"
                  className={`relative flex flex-1 min-w-0 min-h-0 ${settings.isMultipleRowsLayout ? "flex-col" : "flex-row"}${settings.isLocked && annotations.activeTool === "eraser" ? " eraser-mode-container" : ""}${settings.isLocked && annotations.activeTool === "highlight" ? " highlight-mode-container" : ""}${settings.isLocked && annotations.activeTool === "comments" ? " comment-mode-container" : ""}`}
                >
                  <ErrorBoundary silent>
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
                      isLocked={settings.isLocked || effectiveReadOnly}
                      hideOffscreenArrows={settings.hideOffscreenArrows}
                    />
                  </ErrorBoundary>
                  {editorWidths.map((width, i) => {
                    const showDivider = i > 0 && sectionVisibility[i - 1] && sectionVisibility[i];
                    // "direction" is the resize drag axis, not the visual line orientation
                    // (e.g. "horizontal" means drag left/right to resize side-by-side panes)
                    const dividerDirection = settings.isMultipleRowsLayout
                      ? ("vertical" as const)
                      : ("horizontal" as const);
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
                          className="min-w-0 min-h-0 overflow-hidden flex flex-col"
                          style={{
                            flex: `${width} 0 0%`,
                            display: sectionVisibility[i] === false ? "none" : undefined,
                          }}
                        >
                          <PassageHeader
                            name={workspace.sectionNames[i]}
                            index={i}
                            onUpdateName={(name) => workspace.updateSectionName(i, name)}
                          />
                          <div className="flex-1 min-h-0 overflow-hidden">
                            <ErrorBoundary>
                              <EditorPane
                                isLocked={settings.isLocked || effectiveReadOnly}
                                activeTool={annotations.activeTool}
                                content={DEFAULT_PASSAGE_CONTENTS[i] ?? PLACEHOLDER_CONTENT}
                                index={i}
                                fragment={workspace.yjs.getFragment(i)}
                                onEditorMount={handleEditorMount}
                                onFocus={handlePaneFocus}
                                onMouseDown={
                                  settings.isLocked && !effectiveReadOnly
                                    ? handleMouseDown
                                    : undefined
                                }
                                onMouseMove={
                                  settings.isLocked && !effectiveReadOnly
                                    ? handleMouseMove
                                    : undefined
                                }
                                onMouseUp={
                                  settings.isLocked && !effectiveReadOnly
                                    ? handleMouseUp
                                    : undefined
                                }
                                onContentUpdate={
                                  effectiveReadOnly ? undefined : updateEditorContent
                                }
                                layers={layers}
                                selection={selection}
                                selectionHidden={selectionHidden}
                                activeLayerColor={activeLayerColor}
                                isDarkMode={settings.isDarkMode}
                                removeArrow={removeArrow}
                                sectionVisibility={sectionVisibility}
                                selectedArrowId={workspace.selectedArrow?.arrowId ?? null}
                                setLayers={workspace.setLayers}
                                yjsSynced={workspace.yjs.synced}
                              />
                            </ErrorBoundary>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
                {!isMobile && settings.isLocked && hasAnyAnnotations && (
                  <ErrorBoundary silent>
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
                  </ErrorBoundary>
                )}
              </div>
            </div>
          </EditorContext.Provider>
        </div>
        {!isMobile && (
          <ActionConsole
            log={history.log}
            isOpen={actionConsole.isOpen}
            onClose={() => actionConsole.setIsOpen(false)}
            height={actionConsole.consoleHeight}
            onHeightChange={actionConsole.setConsoleHeight}
          />
        )}
        <MobileInfoDialog
          open={isMobile && !mobileDialogDismissed}
          onOpenChange={(open) => {
            if (!open) setMobileDialogDismissed(true);
          }}
        />
      </div>
    </WorkspaceProvider>
  );
}

export default App;
