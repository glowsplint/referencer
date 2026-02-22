// Root application component. Composes the multi-pane editor workspace:
// toolbar, management panel, editor panes with dividers, annotation panel,
// arrow overlay, and action console. Wires together all annotation tools
// (highlight, comment, underline, arrow, eraser) and keyboard navigation.
import { useRef, useState, useCallback, useMemo, Fragment, type RefObject } from "react";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { StatusBar } from "./components/StatusBar";
import { Divider } from "./components/ui/Divider";
import { TitleBar, SimpleEditorToolbar, EditorPane } from "./components/tiptap-templates/simple";
import { UnsavedBanner } from "./components/UnsavedBanner";
import { PassageHeader } from "./components/PassageHeader";
import { DEFAULT_PASSAGE_CONTENTS, PLACEHOLDER_CONTENT } from "./data/default-workspace";
import { useEditorWorkspace } from "./hooks/data/use-editor-workspace";
import { useWordSelection } from "./hooks/selection/use-word-selection";
import { useDrawingMode } from "./hooks/tools/use-drawing-mode";
import { useCommentMode } from "./hooks/tools/use-comment-mode";
import { useHighlightMode } from "./hooks/tools/use-highlight-mode";
import { useUnderlineMode } from "./hooks/tools/use-underline-mode";
import { useEraserMode } from "./hooks/tools/use-eraser-mode";
import { useStatusMessage } from "./hooks/ui/use-status-message";
import { useToolShortcuts } from "./hooks/ui/use-tool-shortcuts";
import { useToggleShortcuts } from "./hooks/ui/use-toggle-shortcuts";
import { useCycleLayer } from "./hooks/ui/use-cycle-layer";
import { useDragSelection } from "./hooks/selection/use-drag-selection";
import { useUndoRedoKeyboard } from "./hooks/ui/use-undo-redo-keyboard";
import { useActionConsole } from "./hooks/ui/use-action-console";
import { useIsBreakpoint } from "./hooks/ui/use-is-breakpoint";
import { useWorkspaceAutosave } from "./hooks/data/use-workspace-autosave";
import { useRecordingManager } from "./hooks/recording/use-recording-manager";
import { useAnnotationEdit } from "./hooks/data/use-annotation-edit";
import { useStatusHints } from "./hooks/ui/use-status-hints";
import { ArrowOverlay } from "./components/ArrowOverlay";
import { AnnotationPanel } from "./components/AnnotationPanel";
import { PrintAnnotations } from "./components/PrintAnnotations";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ActionConsole } from "./components/ActionConsole";
import { MobileInfoDialog } from "./components/MobileInfoDialog";
import { Toaster } from "./components/ui/sonner";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { PlaybackBar } from "./components/PlaybackBar";
import { useCollapsedAnnotations } from "./hooks/annotations/use-collapsed-annotations";

interface AppProps {
  workspaceId: string;
  readOnly: boolean;
  navigate: (hash: string) => void;
}

export function App({ workspaceId, readOnly, navigate }: AppProps) {
  useWorkspaceAutosave(workspaceId);
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

  useToolShortcuts({ isLocked: settings.isLocked, setActiveTool });
  useToggleShortcuts({
    toggleDarkMode: workspace.toggleDarkMode,
    toggleMultipleRowsLayout: workspace.toggleMultipleRowsLayout,
    toggleLocked: workspace.toggleLocked,
    toggleManagementPane: workspace.toggleManagementPane,
  });
  useUndoRedoKeyboard(unifiedUndo);

  // Recording & playback
  const recordingContextValue = useRecordingManager({
    doc: workspace.yjs.doc,
    layers: workspace.layers,
    sectionVisibility: workspace.sectionVisibility,
    toggleLayerVisibility: workspace.toggleLayerVisibility,
    toggleSectionVisibility: workspace.toggleSectionVisibility,
  });

  const actionConsole = useActionConsole();
  const { message: statusMessage, setStatus, flashStatus, clearStatus } = useStatusMessage();

  const containerRef = useRef<HTMLDivElement>(null);
  const { collapsedIds, toggleCollapse, collapseAll, expandAll } = useCollapsedAnnotations(workspaceId);
  const confirmRef = useRef<() => void>(() => {}) as RefObject<() => void>;

  const { editingAnnotation, handleAnnotationBlur, handleAnnotationClick, onHighlightAdded } =
    useAnnotationEdit({ layers, removeHighlight, updateHighlightAnnotation, history });

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
    onHighlightAdded,
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

  useStatusHints({
    isLocked: settings.isLocked,
    effectiveReadOnly,
    activeTool: annotations.activeTool,
    selection,
    selectionHidden,
    setStatus,
    setSelectedArrow: workspace.setSelectedArrow,
  });

  useEffect(() => {
    confirmRef.current = () => {
      confirmSelection();
      confirmComment();
      confirmHighlight();
      confirmUnderline();
      confirmErase();
    };
  });

  useCycleLayer({ layers, activeLayerId, setActiveLayer });

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

  const handleCollapseAll = useCallback(() => {
    const allCommentIds = layers.flatMap((l) =>
      l.visible ? l.highlights.filter((h) => h.type === "comment").map((h) => h.id) : [],
    );
    collapseAll(allCommentIds);
  }, [layers, collapseAll]);

  return (
    <WorkspaceProvider value={workspace}>
      <RecordingProvider value={recordingContextValue}>
      <Toaster />
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex flex-1 min-h-0">
          {!isMobile && <ButtonPane />}
          {!isMobile && isManagementPaneOpen && <ManagementPane />}
          <EditorContext.Provider value={{ editor: activeEditor }}>
            <div className="flex flex-col flex-1 min-w-0">
              <TitleBar navigate={navigate} />
              <UnsavedBanner />
              <SimpleEditorToolbar isLocked={settings.isLocked} />
              {!isMobile && settings.showStatusBar && <StatusBar message={statusMessage} />}
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
                        collapsedIds={collapsedIds}
                        onToggleCollapse={toggleCollapse}
                        onCollapseAll={handleCollapseAll}
                        onExpandAll={expandAll}
                      />
                    </ErrorBoundary>
                  )}
                  <div className="hidden print:block w-56 flex-shrink-0 pl-4 print-annotations-container">
                    <PrintAnnotations
                      layers={layers}
                      sectionNames={workspace.sectionNames}
                      sectionVisibility={sectionVisibility}
                    />
                  </div>
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
        <PlaybackBar />
      </RecordingProvider>
    </WorkspaceProvider>
  );
}
