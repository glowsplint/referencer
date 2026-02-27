// Root application component. Composes the multi-pane editor workspace:
// toolbar, management panel, editor panes with dividers, annotation panel,
// arrow overlay, and action console. Wires together all annotation tools
// (highlight, comment, underline, arrow, eraser) and keyboard navigation.
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  Fragment,
  type RefObject,
  type ReactNode,
} from "react";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { StatusBar } from "./components/StatusBar";
import { Divider } from "./components/ui/Divider";
import { ManagementPaneDivider } from "./components/ui/ManagementPaneDivider";
import { TitleBar, SimpleEditorToolbar, EditorPane } from "./components/tiptap-templates/simple";
import { UnsavedBanner } from "./components/UnsavedBanner";
import { PassageHeader } from "./components/PassageHeader";
import { PLACEHOLDER_CONTENT } from "./data/default-workspace";
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
import { Loader2 } from "lucide-react";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { RecordingProvider } from "./contexts/RecordingContext";
import { PlaybackBar } from "./components/PlaybackBar";
import { EditorTour } from "./components/tour/EditorTour";
import { useCollapsedAnnotations } from "./hooks/annotations/use-collapsed-annotations";
import { useCurrentUserName } from "./hooks/data/use-current-user-name";
import { apiFetch } from "@/lib/api-client";
import { STORAGE_KEYS } from "@/constants/storage-keys";

function getEditorColumns(editorCount: number): { left: number[]; right: number[] } {
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < editorCount; i++) {
    (i % 2 === 0 ? left : right).push(i);
  }
  return { left, right };
}

interface AppProps {
  workspaceId: string;
  navigate: (hash: string) => void;
}

export function App({ workspaceId, navigate }: AppProps) {
  const [managementPaneWidth, setManagementPaneWidth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.MANAGEMENT_PANE_WIDTH);
    return stored ? Number(stored) : 250;
  });
  const handleManagementPaneResizeEnd = useCallback((width: number) => {
    localStorage.setItem(STORAGE_KEYS.MANAGEMENT_PANE_WIDTH, String(width));
  }, []);

  const [permissionRole, setPermissionRole] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ role: string }>(`/api/workspaces/${workspaceId}/permission`, {
      signal: controller.signal,
    })
      .then((data) => setPermissionRole(data?.role ?? null))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPermissionRole(null);
      });
    return () => controller.abort();
  }, [workspaceId]);
  const readOnly = permissionRole === "viewer";
  useWorkspaceAutosave(workspaceId);
  const workspace = useEditorWorkspace(workspaceId, readOnly);
  const {
    settings,
    layers,
    activeLayerId,
    editorCount,
    activeEditor,
    editorWidths,
    columnSplit,
    rowSplit,
    handleColumnResize,
    handleRowResize,
    isManagementPaneOpen,
    setActiveLayer,
    addHighlight,
    removeHighlight,
    updateHighlightAnnotation,
    addReply,
    removeReply,
    toggleReactionOnHighlight,
    toggleReactionOnReply,
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
  } = workspace;

  const currentUserName = useCurrentUserName();
  const isMobile = useIsBreakpoint("max", 768);
  const effectiveReadOnly = readOnly || isMobile;
  const [mobileDialogDismissed, setMobileDialogDismissed] = useState(false);

  useToolShortcuts({ isLocked: settings.isLocked, setActiveTool });
  useToggleShortcuts({
    toggleDarkMode: workspace.toggleDarkMode,
    toggleMultipleRowsLayout: workspace.toggleMultipleRowsLayout,
    toggleLocked: workspace.toggleLocked,
    toggleManagementPane: workspace.toggleManagementPane,
    toggleCommentPlacement: workspace.toggleCommentPlacement,
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
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const { collapsedIds, toggleCollapse, collapseAll, expandAll } =
    useCollapsedAnnotations(workspaceId);
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
    isRecording: recordingContextValue.recordings.isRecording,
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

  const editorColumns = useMemo(() => getEditorColumns(editorCount), [editorCount]);

  const hasAnnotationsForEditors = useCallback(
    (indices: number[]) =>
      layers.some(
        (l) =>
          l.visible &&
          l.highlights.some(
            (h) =>
              h.type === "comment" &&
              indices.includes(h.editorIndex) &&
              sectionVisibility[h.editorIndex] !== false,
          ),
      ),
    [layers, sectionVisibility],
  );

  const hasAnyAnnotations = useMemo(
    () => hasAnnotationsForEditors([...editorColumns.left, ...editorColumns.right]),
    [hasAnnotationsForEditors, editorColumns],
  );
  const hasLeftAnnotations = useMemo(
    () => hasAnnotationsForEditors(editorColumns.left),
    [hasAnnotationsForEditors, editorColumns],
  );
  const hasRightAnnotations = useMemo(
    () => hasAnnotationsForEditors(editorColumns.right),
    [hasAnnotationsForEditors, editorColumns],
  );

  const handleCollapseAll = useCallback(() => {
    const allCommentIds = layers.flatMap((l) =>
      l.visible ? l.highlights.filter((h) => h.type === "comment").map((h) => h.id) : [],
    );
    collapseAll(allCommentIds);
  }, [layers, collapseAll]);

  const handleAddReply = useCallback(
    (layerId: string, highlightId: string, text: string) => {
      addReply(layerId, highlightId, {
        id: crypto.randomUUID(),
        text,
        userName: currentUserName,
        timestamp: Date.now(),
        reactions: [],
      });
    },
    [addReply, currentUserName],
  );

  const handleToggleReaction = useCallback(
    (layerId: string, highlightId: string, emoji: string) => {
      toggleReactionOnHighlight(layerId, highlightId, emoji, currentUserName);
    },
    [toggleReactionOnHighlight, currentUserName],
  );

  const handleToggleReplyReaction = useCallback(
    (layerId: string, highlightId: string, replyId: string, emoji: string) => {
      toggleReactionOnReply(layerId, highlightId, replyId, emoji, currentUserName);
    },
    [toggleReactionOnReply, currentUserName],
  );

  const annotationPanelProps = {
    layers,
    editorsRef,
    containerRef,
    editingAnnotation,
    onAnnotationChange: updateHighlightAnnotation,
    onAnnotationBlur: handleAnnotationBlur,
    onAnnotationClick: handleAnnotationClick,
    isDarkMode: settings.isDarkMode,
    sectionVisibility,
    collapsedIds,
    onToggleCollapse: toggleCollapse,
    onCollapseAll: handleCollapseAll,
    onExpandAll: expandAll,
    currentUserName,
    onAddReply: handleAddReply,
    onRemoveReply: removeReply,
    onToggleReaction: handleToggleReaction,
    onToggleReplyReaction: handleToggleReplyReaction,
  };

  function renderEditorCell(i: number, fullWidth?: boolean): ReactNode {
    const cellFlex = fullWidth ? "1 0 0%" : `${i % 2 === 0 ? columnSplit : 100 - columnSplit} 0 0%`;
    return (
      <div
        key={editorKeys[i]}
        className="min-w-0 min-h-0 overflow-hidden flex flex-col"
        style={{
          flex: cellFlex,
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
              content={PLACEHOLDER_CONTENT}
              index={i}
              fragment={workspace.yjs.getFragment(i)}
              onEditorMount={handleEditorMount}
              onFocus={handlePaneFocus}
              onMouseDown={settings.isLocked && !effectiveReadOnly ? handleMouseDown : undefined}
              onMouseMove={settings.isLocked && !effectiveReadOnly ? handleMouseMove : undefined}
              onMouseUp={settings.isLocked && !effectiveReadOnly ? handleMouseUp : undefined}
              layers={layers}
              selection={selection}
              selectionHidden={selectionHidden}
              activeLayerColor={activeLayerColor}
              isDarkMode={settings.isDarkMode}
              removeArrow={removeArrow}
              sectionVisibility={sectionVisibility}
              selectedArrowId={workspace.selectedArrow?.arrowId ?? null}
              yjsSynced={workspace.readyForSeeding}
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider value={workspace}>
      <RecordingProvider value={recordingContextValue}>
        <Toaster />
        <EditorTour />
        <div className="flex flex-col h-screen overflow-hidden">
          <div className="flex flex-1 min-h-0">
            {!isMobile && <ButtonPane />}
            {!isMobile && isManagementPaneOpen && (
              <>
                <ManagementPane width={managementPaneWidth} />
                <ManagementPaneDivider
                  width={managementPaneWidth}
                  onResize={setManagementPaneWidth}
                  onResizeEnd={handleManagementPaneResizeEnd}
                />
              </>
            )}
            <EditorContext.Provider value={{ editor: activeEditor }}>
              <div className="flex flex-col flex-1 min-w-0">
                <TitleBar navigate={navigate} />
                <UnsavedBanner />
                <SimpleEditorToolbar isLocked={settings.isLocked} />
                {!isMobile && settings.showStatusBar && <StatusBar message={statusMessage} />}
                <div className="flex flex-1 min-w-0 min-h-0">
                  {!isMobile &&
                    settings.isLocked &&
                    ((settings.commentPlacement === "left" && hasAnyAnnotations) ||
                      (settings.commentPlacement === "both" && hasLeftAnnotations)) && (
                      <ErrorBoundary silent>
                        <AnnotationPanel
                          {...annotationPanelProps}
                          placement="left"
                          editorIndices={
                            settings.commentPlacement === "both" ? editorColumns.left : undefined
                          }
                        />
                      </ErrorBoundary>
                    )}
                  <div
                    ref={containerRef}
                    data-testid="editorContainer"
                    className={`relative flex flex-1 min-w-0 min-h-0 flex-col${settings.isLocked && annotations.activeTool === "eraser" ? " eraser-mode-container" : ""}${settings.isLocked && annotations.activeTool === "highlight" ? " highlight-mode-container" : ""}${settings.isLocked && annotations.activeTool === "comments" ? " comment-mode-container" : ""}`}
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
                    {workspace.demoLoading && (
                      <div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
                        data-testid="demoLoadingOverlay"
                      >
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!settings.isMultipleRowsLayout ? (
                      <>
                        {/* Top row */}
                        <div
                          ref={topRowRef}
                          className="flex flex-row min-w-0 min-h-0"
                          style={{ flex: editorCount > 2 ? `${rowSplit} 0 0%` : "1 0 0%" }}
                        >
                          {renderEditorCell(0)}
                          {editorCount >= 2 && sectionVisibility[0] && sectionVisibility[1] && (
                            <Divider
                              onResize={handleColumnResize}
                              containerRef={topRowRef}
                              direction="horizontal"
                            />
                          )}
                          {editorCount >= 2 && renderEditorCell(1)}
                        </div>
                        {/* Row divider */}
                        {editorCount > 2 && (
                          <Divider
                            onResize={handleRowResize}
                            containerRef={containerRef}
                            direction="vertical"
                          />
                        )}
                        {/* Bottom row */}
                        {editorCount > 2 && (
                          <div
                            ref={bottomRowRef}
                            className="flex flex-row min-w-0 min-h-0"
                            style={{ flex: `${100 - rowSplit} 0 0%` }}
                          >
                            {renderEditorCell(
                              2,
                              editorCount === 3 && settings.thirdEditorFullWidth,
                            )}
                            {editorCount >= 4 && sectionVisibility[2] && sectionVisibility[3] && (
                              <Divider
                                onResize={handleColumnResize}
                                containerRef={bottomRowRef}
                                direction="horizontal"
                              />
                            )}
                            {editorCount >= 4 && renderEditorCell(3)}
                          </div>
                        )}
                      </>
                    ) : (
                      editorWidths.map((width, i) => {
                        const showDivider =
                          i > 0 && sectionVisibility[i - 1] && sectionVisibility[i];
                        return (
                          <Fragment key={editorKeys[i]}>
                            {showDivider && (
                              <Divider
                                onResize={(pct) => handleDividerResize(i - 1, pct)}
                                containerRef={containerRef}
                                direction="vertical"
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
                                    content={PLACEHOLDER_CONTENT}
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
                                    layers={layers}
                                    selection={selection}
                                    selectionHidden={selectionHidden}
                                    activeLayerColor={activeLayerColor}
                                    isDarkMode={settings.isDarkMode}
                                    removeArrow={removeArrow}
                                    sectionVisibility={sectionVisibility}
                                    selectedArrowId={workspace.selectedArrow?.arrowId ?? null}
                                    yjsSynced={workspace.readyForSeeding}
                                  />
                                </ErrorBoundary>
                              </div>
                            </div>
                          </Fragment>
                        );
                      })
                    )}
                  </div>
                  {!isMobile &&
                    settings.isLocked &&
                    ((settings.commentPlacement === "right" && hasAnyAnnotations) ||
                      (settings.commentPlacement === "both" && hasRightAnnotations)) && (
                      <ErrorBoundary silent>
                        <AnnotationPanel
                          {...annotationPanelProps}
                          placement="right"
                          editorIndices={
                            settings.commentPlacement === "both" ? editorColumns.right : undefined
                          }
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
