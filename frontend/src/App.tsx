// Root application component. Composes the multi-pane editor document:
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
  Suspense,
  lazy,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import type * as Y from "yjs";
import { EditorContext } from "@tiptap/react";
import { ButtonPane } from "./components/ButtonPane";
import { ManagementPane } from "./components/ManagementPane";
import { StatusBar } from "./components/StatusBar";
import { Divider } from "./components/ui/Divider";
import { ManagementPaneDivider } from "./components/ui/ManagementPaneDivider";
import { TitleBar, SimpleEditorToolbar, EditorPane } from "./components/tiptap-templates/simple";
import { UnsavedBanner } from "./components/UnsavedBanner";
import { TextHeader } from "./components/TextHeader";
import { PLACEHOLDER_CONTENT } from "./data/default-document";
import { useEditorDocument } from "./hooks/data/use-editor-document";
import { usePaneTypes } from "./hooks/data/use-pane-types";
import { uploadPdf } from "./lib/pdf/pdf-storage";
import { useWordSelection } from "./hooks/selection/use-word-selection";
import { useDrawingMode } from "./hooks/tools/use-drawing-mode";
import { useCommentMode } from "./hooks/tools/use-comment-mode";
import { useHighlightMode } from "./hooks/tools/use-highlight-mode";
import { useUnderlineMode } from "./hooks/tools/use-underline-mode";
import { useEraserMode } from "./hooks/tools/use-eraser-mode";
import { useStatusMessage } from "./hooks/ui/use-status-message";
import { useForceSave } from "./hooks/ui/use-force-save";
import { useToolShortcuts } from "./hooks/ui/use-tool-shortcuts";
import { useToggleShortcuts } from "./hooks/ui/use-toggle-shortcuts";
import { useCycleLayer } from "./hooks/ui/use-cycle-layer";
import { useDragSelection } from "./hooks/selection/use-drag-selection";
import { useUndoRedoKeyboard } from "./hooks/ui/use-undo-redo-keyboard";
import { useActionConsole } from "./hooks/ui/use-action-console";
import { useZenMode } from "./hooks/ui/use-zen-mode";
import { useIsBreakpoint } from "./hooks/ui/use-is-breakpoint";
import { useDocumentAutosave } from "./hooks/data/use-document-autosave";

import { useAnnotationEdit } from "./hooks/data/use-annotation-edit";
import { useStatusHints } from "./hooks/ui/use-status-hints";
import { ArrowOverlay } from "./components/ArrowOverlay";
import {
  AnnotationPanel,
  DEFAULT_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
} from "./components/AnnotationPanel";
import { PrintAnnotations } from "./components/PrintAnnotations";
import { PrintHeader } from "./components/PrintHeader";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ActionConsole } from "./components/ActionConsole";
import { MobileInfoDialog } from "./components/MobileInfoDialog";
import { Toaster } from "./components/ui/sonner";
import { MessageSquare, X } from "lucide-react";
import { DocumentProvider } from "./contexts/DocumentContext";

import { EditorTour } from "./components/tour/EditorTour";
import { useCollapsedAnnotations } from "./hooks/annotations/use-collapsed-annotations";
import { useCurrentUserName } from "./hooks/data/use-current-user-name";
import { useMentionableUsers } from "./hooks/data/use-mentionable-users";
import { apiFetch } from "@/lib/api-client";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { PaneMetadata } from "@/types/editor";

const LazyPdfPane = lazy(() =>
  import("./components/PdfPane").then((m) => ({ default: m.PdfPane })),
);

function getEditorColumns(editorCount: number): { left: number[]; right: number[] } {
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < editorCount; i++) {
    (i % 2 === 0 ? left : right).push(i);
  }
  return { left, right };
}

interface EditorCellProps {
  index: number;
  editorKey: number;
  columnSplit: number;
  sectionVisible: boolean;
  sectionName: string;
  onUpdateName: (name: string) => void;
  isLocked: boolean;
  effectiveReadOnly: boolean;
  activeTool: import("@/types/editor").ActiveTool;
  fragment: Y.XmlFragment | null;
  onEditorMount: (index: number, editor: import("@tiptap/react").Editor) => void;
  onFocus: (index: number) => void;
  onMouseDown?: (
    e: React.MouseEvent,
    editor: import("@tiptap/react").Editor,
    editorIndex: number,
  ) => void;
  onMouseMove?: (
    e: React.MouseEvent,
    editor: import("@tiptap/react").Editor,
    editorIndex: number,
  ) => void;
  onMouseUp?: (
    e: React.MouseEvent,
    editor: import("@tiptap/react").Editor,
    editorIndex: number,
  ) => void;
  layers: import("@/types/editor").Layer[];
  selection: import("@/types/editor").WordSelection | null;
  selectionHidden: boolean;
  activeLayerColor: string | null;
  isDarkMode: boolean;
  removeArrow: (layerId: string, arrowId: string) => void;
  sectionVisibility: boolean[];
  selectedArrowId: string | null;
  yjsSynced: boolean;
  overscroll: boolean;
  isZenMode?: boolean;
  paneMetadata?: PaneMetadata;
  onUploadPdf?: (file: File) => void;
  onRemovePdf?: () => void;
  documentId: string;
}

function EditorCell({
  index: i,
  columnSplit,
  sectionVisible,
  sectionName,
  onUpdateName,
  isLocked,
  effectiveReadOnly,
  activeTool,
  fragment,
  onEditorMount,
  onFocus: handlePaneFocus,
  onMouseDown: handleMouseDown,
  onMouseMove: handleMouseMove,
  onMouseUp: handleMouseUp,
  layers,
  selection,
  selectionHidden,
  activeLayerColor,
  isDarkMode,
  removeArrow,
  sectionVisibility,
  selectedArrowId,
  yjsSynced,
  overscroll,
  isZenMode,
  paneMetadata,
  onUploadPdf,
  onRemovePdf,
  documentId,
}: EditorCellProps) {
  const cellFlex = `${i % 2 === 0 ? columnSplit : 100 - columnSplit} 0 0%`;
  const isPdf = paneMetadata?.type === "pdf" && paneMetadata.storageKey && paneMetadata.filename;
  return (
    <div
      className="min-w-0 min-h-0 overflow-hidden flex flex-col"
      style={{
        flex: cellFlex,
        display: sectionVisible === false ? "none" : undefined,
      }}
    >
      {!isZenMode && (
        <TextHeader
          name={sectionName}
          index={i}
          onUpdateName={onUpdateName}
          onUploadPdf={onUploadPdf}
        />
      )}
      {isPdf ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading...
              </div>
            }
          >
            <LazyPdfPane
              documentId={documentId}
              paneIndex={i}
              storageKey={paneMetadata.storageKey!}
              filename={paneMetadata.filename!}
              onRemove={onRemovePdf!}
            />
          </Suspense>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ErrorBoundary>
            <EditorPane
              isLocked={isLocked || effectiveReadOnly}
              activeTool={activeTool}
              content={PLACEHOLDER_CONTENT}
              index={i}
              fragment={fragment}
              onEditorMount={onEditorMount}
              onFocus={handlePaneFocus}
              onMouseDown={isLocked && !effectiveReadOnly ? handleMouseDown : undefined}
              onMouseMove={isLocked && !effectiveReadOnly ? handleMouseMove : undefined}
              onMouseUp={isLocked && !effectiveReadOnly ? handleMouseUp : undefined}
              layers={layers}
              selection={selection}
              selectionHidden={selectionHidden}
              activeLayerColor={activeLayerColor}
              isDarkMode={isDarkMode}
              removeArrow={removeArrow}
              sectionVisibility={sectionVisibility}
              selectedArrowId={selectedArrowId}
              yjsSynced={yjsSynced}
              overscroll={overscroll}
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

interface AppProps {
  documentId: string;
  navigate: (hash: string) => void;
}

export function App({ documentId, navigate }: AppProps) {
  const [managementPaneWidth, setManagementPaneWidth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.MANAGEMENT_PANE_WIDTH);
    return stored ? Number(stored) : 250;
  });
  const handleManagementPaneResizeEnd = useCallback((width: number) => {
    localStorage.setItem(STORAGE_KEYS.MANAGEMENT_PANE_WIDTH, String(width));
  }, []);

  const [annotationPanelWidth, setAnnotationPanelWidth] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ANNOTATION_PANEL_WIDTH);
    return stored ? Number(stored) : DEFAULT_PANEL_WIDTH;
  });
  const handleAnnotationPanelResizeEnd = useCallback((width: number) => {
    localStorage.setItem(STORAGE_KEYS.ANNOTATION_PANEL_WIDTH, String(width));
  }, []);

  const handleAnnotationPanelDrag = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      e.preventDefault();
      document.body.style.userSelect = "none";
      const startX = e.clientX;
      const startWidth = annotationPanelWidth;
      let currentWidth = startWidth;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = side === "right" ? startX - ev.clientX : ev.clientX - startX;
        currentWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth + delta));
        setAnnotationPanelWidth(currentWidth);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
        handleAnnotationPanelResizeEnd(currentWidth);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [annotationPanelWidth, handleAnnotationPanelResizeEnd],
  );

  const [permissionRole, setPermissionRole] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ role: string }>(`/api/documents/${documentId}/permission`, {
      signal: controller.signal,
    })
      .then((data) => setPermissionRole(data?.role ?? null))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPermissionRole(null);
      });
    return () => controller.abort();
  }, [documentId]);
  const readOnly = permissionRole === "viewer";
  useDocumentAutosave(documentId);
  const docCtx = useEditorDocument(documentId, readOnly);

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
  } = docCtx;

  const { paneTypes, setPaneType, clearPaneType } = usePaneTypes(docCtx.yjs.doc);

  const handleUploadPdf = useCallback(
    async (index: number, file: File) => {
      if (!documentId) return;
      try {
        const { storageKey } = await uploadPdf(documentId, index, file);
        setPaneType(index, "pdf", { storageKey, filename: file.name });
      } catch (err) {
        console.error("PDF upload failed:", err);
      }
    },
    [documentId, setPaneType],
  );

  const handleRemovePdf = useCallback(
    (index: number) => {
      clearPaneType(index);
    },
    [clearPaneType],
  );

  const [printTitle, setPrintTitle] = useState("Untitled");
  useEffect(() => {
    if (!docCtx.yjs.doc) return;
    const meta = docCtx.yjs.doc.getMap("document-meta");
    const existing = meta.get("title");
    if (typeof existing === "string" && existing) setPrintTitle(existing);
    const observer = () => {
      const t = meta.get("title");
      if (typeof t === "string" && t) setPrintTitle(t);
    };
    meta.observe(observer);
    return () => meta.unobserve(observer);
  }, [docCtx.yjs.doc]);

  const annotationCounts = useMemo(() => {
    let comments = 0,
      highlights = 0,
      underlines = 0,
      connections = 0;
    for (const layer of layers) {
      if (!layer.visible) continue;
      for (const h of layer.highlights) {
        if (sectionVisibility[h.editorIndex] === false) continue;
        if (h.type === "comment") comments++;
        else if (h.type === "highlight") highlights++;
      }
      for (const u of layer.underlines) {
        if (sectionVisibility[u.editorIndex] === false) continue;
        underlines++;
      }
      for (const a of layer.arrows) {
        if (sectionVisibility[a.from.editorIndex] === false) continue;
        if (sectionVisibility[a.to.editorIndex] === false) continue;
        connections++;
      }
    }
    return { comments, highlights, underlines, connections };
  }, [layers, sectionVisibility]);

  const displayLayers = useMemo(
    () =>
      settings.hideAnnotations
        ? layers.map((l) => ({ ...l, highlights: [], arrows: [], underlines: [] }))
        : layers,
    [settings.hideAnnotations, layers],
  );

  const currentUserName = useCurrentUserName();
  const mentionSuggestions = useMentionableUsers(docCtx.yjs.wsProvider, documentId);
  const isMobile = useIsBreakpoint("max", 768);
  const effectiveReadOnly = readOnly || isMobile;
  const [mobileDialogDismissed, setMobileDialogDismissed] = useState(false);
  const [mobileAnnotationPanelOpen, setMobileAnnotationPanelOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const { isPaneLocked, isAnyPaneLocked, activeEditorIndex } = docCtx;
  const focusedPaneLocked = isPaneLocked(activeEditorIndex);
  const anyPaneLocked = isAnyPaneLocked;

  useToolShortcuts({ isLocked: focusedPaneLocked, setActiveTool });
  useToggleShortcuts({
    toggleDarkMode: docCtx.cycleTheme,
    toggleMultipleRowsLayout: docCtx.toggleMultipleRowsLayout,
    toggleLocked: docCtx.toggleFocusedPaneLocked,
    toggleManagementPane: docCtx.toggleManagementPane,
    toggleCommentPlacement: docCtx.toggleCommentPlacement,
    addText: docCtx.addEditor,
    toggleHideAnnotations: docCtx.toggleHideAnnotations,
  });
  useUndoRedoKeyboard(unifiedUndo);

  const { t } = useTranslation();
  const actionConsole = useActionConsole();
  const zenMode = useZenMode();

  const handleEnterZenMode = useCallback(() => {
    actionConsole.setIsOpen(false);
    zenMode.enterZenMode();
  }, [actionConsole, zenMode]);

  const { message: statusMessage, setStatus, flashStatus, clearStatus } = useStatusMessage();

  useForceSave({
    wsProvider: docCtx.yjs.wsProvider,
    connectionManager: docCtx.yjs.provider?.connectionManager ?? null,
    setStatus,
    flashStatus,
    clearStatus,
  });

  const prevHideAnnotations = useRef(settings.hideAnnotations);
  useEffect(() => {
    if (prevHideAnnotations.current !== settings.hideAnnotations) {
      prevHideAnnotations.current = settings.hideAnnotations;
      flashStatus(
        {
          text: settings.hideAnnotations
            ? t("status.annotationsHidden")
            : t("status.annotationsVisible"),
          type: "info",
        },
        2000,
      );
    }
  }, [settings.hideAnnotations, flashStatus, t]);

  const containerRef = useRef<HTMLDivElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const { collapsedIds, toggleCollapse, collapseAll, expandAll } =
    useCollapsedAnnotations(documentId);
  const confirmRef = useRef<() => void>(() => {}) as RefObject<() => void>;

  const { editingAnnotation, handleAnnotationBlur, handleAnnotationClick, onHighlightAdded } =
    useAnnotationEdit({ layers, removeHighlight, updateHighlightAnnotation, history });

  const { selection, selectionHidden, selectWord, selectRange, clearSelection, hideSelection } =
    useWordSelection({
      isLocked: anyPaneLocked,
      editorsRef,
      containerRef,
      editorCount,
      onEnter: useCallback(() => confirmRef.current(), []),
      onEscape: useCallback(() => {
        setActiveTool("selection");
        docCtx.setSelectedArrow(null);
      }, [setActiveTool, docCtx]),
    });

  const { drawingState, confirmSelection } = useDrawingMode({
    isLocked: anyPaneLocked,
    activeTool: annotations.activeTool,
    selection,
    activeLayerId,
    activeArrowStyle: docCtx.activeArrowStyle,
    addLayer,
    addArrow,
    setStatus,
    flashStatus,
    clearStatus,
  });

  const { confirmComment } = useCommentMode({
    isLocked: anyPaneLocked,
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
    isLocked: anyPaneLocked,
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
    isLocked: anyPaneLocked,
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
    isLocked: anyPaneLocked,
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
    isLocked: anyPaneLocked,
    effectiveReadOnly,
    activeTool: annotations.activeTool,
    selection,
    selectionHidden,
    setStatus,
    setSelectedArrow: docCtx.setSelectedArrow,
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

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp: rawHandleMouseUp,
  } = useDragSelection({
    isLocked: anyPaneLocked,
    activeTool: annotations.activeTool,
    selectWord,
    selectRange,
    clearSelection,
    eraseAtPosition,
  });

  const handleMouseUp = useCallback(
    (e: React.MouseEvent, editor: import("@tiptap/react").Editor, editorIndex: number) => {
      rawHandleMouseUp(e, editor, editorIndex);
      if (annotations.activeTool === "highlight") {
        setTimeout(() => confirmHighlight(), 0);
      } else if (annotations.activeTool === "underline") {
        setTimeout(() => confirmUnderline(), 0);
      }
    },
    [rawHandleMouseUp, annotations.activeTool, confirmHighlight, confirmUnderline],
  );

  // Mutual exclusivity: selecting an arrow hides word selection
  const handleSetSelectedArrow = useCallback(
    (arrow: { layerId: string; arrowId: string } | null) => {
      docCtx.setSelectedArrow(arrow);
      if (arrow) hideSelection();
    },
    [docCtx, hideSelection],
  );

  const activeLayerColor = activeLayerId
    ? (layers.find((l) => l.id === activeLayerId)?.color ?? null)
    : null;

  const editorColumns = useMemo(() => getEditorColumns(editorCount), [editorCount]);

  const hasAnnotationsForEditors = useCallback(
    (indices: number[]) =>
      displayLayers.some(
        (l) =>
          l.visible &&
          l.highlights.some(
            (h) =>
              h.type === "comment" &&
              indices.includes(h.editorIndex) &&
              sectionVisibility[h.editorIndex] !== false,
          ),
      ),
    [displayLayers, sectionVisibility],
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
    layers: displayLayers,
    editorsRef,
    containerRef,
    editingAnnotation,
    onAnnotationChange: updateHighlightAnnotation,
    onAnnotationBlur: handleAnnotationBlur,
    onAnnotationClick: handleAnnotationClick,
    isDarkMode: docCtx.isDarkMode,
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
    mentionSuggestions,
  };

  const editorCellProps = (i: number): EditorCellProps => ({
    index: i,
    editorKey: editorKeys[i],
    columnSplit,
    sectionVisible: sectionVisibility[i] !== false,
    sectionName: docCtx.sectionNames[i],
    onUpdateName: (name: string) => docCtx.updateSectionName(i, name),
    isLocked: isPaneLocked(i),
    effectiveReadOnly,
    activeTool: annotations.activeTool,
    fragment: docCtx.yjs.getFragment(i),
    onEditorMount: handleEditorMount,
    onFocus: handlePaneFocus,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    layers: displayLayers,
    selection,
    selectionHidden,
    activeLayerColor,
    isDarkMode: docCtx.isDarkMode,
    removeArrow,
    sectionVisibility,
    selectedArrowId: docCtx.selectedArrow?.arrowId ?? null,
    yjsSynced: docCtx.readyForSeeding,
    overscroll: settings.overscroll,
    isZenMode: zenMode.isZenMode,
    paneMetadata: paneTypes[i],
    onUploadPdf: (file: File) => handleUploadPdf(i, file),
    onRemovePdf: () => handleRemovePdf(i),
    documentId,
  });

  return (
    <DocumentProvider value={docCtx}>
      <Toaster />
      <EditorTour />
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex flex-1 min-h-0">
          {!isMobile && !zenMode.isZenMode && <ButtonPane />}
          {!isMobile && !zenMode.isZenMode && isManagementPaneOpen && (
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
              {!zenMode.isZenMode && <TitleBar navigate={navigate} />}
              {!zenMode.isZenMode && <UnsavedBanner />}
              {!zenMode.isZenMode && (
                <PrintHeader
                  title={printTitle}
                  layers={layers}
                  annotationCounts={annotationCounts}
                />
              )}
              {!zenMode.isZenMode && <SimpleEditorToolbar isLocked={focusedPaneLocked} />}
              {!isMobile && !zenMode.isZenMode && settings.showStatusBar && (
                <StatusBar message={statusMessage} />
              )}
              <div className="flex flex-1 min-w-0 min-h-0">
                {!isMobile &&
                  !zenMode.isZenMode &&
                  anyPaneLocked &&
                  ((settings.commentPlacement === "left" && hasAnyAnnotations) ||
                    (settings.commentPlacement === "both" && hasLeftAnnotations)) && (
                    <>
                      <ErrorBoundary silent>
                        <AnnotationPanel
                          {...annotationPanelProps}
                          placement="left"
                          width={annotationPanelWidth}
                          editorIndices={
                            settings.commentPlacement === "both" ? editorColumns.left : undefined
                          }
                          isCollapsed={leftPanelCollapsed}
                          onToggleCollapsed={() => setLeftPanelCollapsed((v) => !v)}
                        />
                      </ErrorBoundary>
                      {!leftPanelCollapsed && (
                        <div
                          role="separator"
                          data-testid="annotation-panel-divider"
                          onMouseDown={(e) => handleAnnotationPanelDrag(e, "left")}
                          className="flex flex-col items-center w-1.5 h-full cursor-col-resize hover:bg-accent transition-colors shrink-0"
                        >
                          <div className="flex-1 w-px bg-gray-300" />
                        </div>
                      )}
                    </>
                  )}
                <div
                  ref={containerRef}
                  data-testid="editorContainer"
                  className={`relative flex flex-1 min-w-0 min-h-0 flex-col${anyPaneLocked && annotations.activeTool === "eraser" ? " eraser-mode-container" : ""}${anyPaneLocked && annotations.activeTool === "highlight" ? " highlight-mode-container" : ""}${anyPaneLocked && annotations.activeTool === "comments" ? " comment-mode-container" : ""}`}
                >
                  <ErrorBoundary silent>
                    <ArrowOverlay
                      layers={displayLayers}
                      drawingState={drawingState}
                      drawingColor={activeLayerColor}
                      editorsRef={editorsRef}
                      containerRef={containerRef}
                      removeArrow={removeArrow}
                      selectedArrow={docCtx.selectedArrow}
                      setSelectedArrow={handleSetSelectedArrow}
                      activeTool={annotations.activeTool}
                      sectionVisibility={sectionVisibility}
                      isDarkMode={docCtx.isDarkMode}
                      isLocked={anyPaneLocked || effectiveReadOnly}
                      hideOffscreenArrows={settings.hideOffscreenArrows}
                    />
                  </ErrorBoundary>
                  {!settings.isMultipleRowsLayout
                    ? (() => {
                        const topRowVisible =
                          sectionVisibility[0] || (editorCount >= 2 && sectionVisibility[1]);
                        const bottomRowVisible =
                          editorCount > 2 &&
                          (sectionVisibility[2] || (editorCount >= 4 && sectionVisibility[3]));
                        const bothRowsVisible = topRowVisible && bottomRowVisible;
                        return (
                          <>
                            {/* Top row */}
                            {topRowVisible && (
                              <div
                                ref={topRowRef}
                                className="flex flex-row min-w-0 min-h-0"
                                style={{
                                  flex: bothRowsVisible ? `${rowSplit} 0 0%` : "1 0 0%",
                                }}
                              >
                                <EditorCell key={editorKeys[0]} {...editorCellProps(0)} />
                                {!zenMode.isZenMode &&
                                  editorCount >= 2 &&
                                  sectionVisibility[0] &&
                                  sectionVisibility[1] && (
                                    <Divider
                                      onResize={handleColumnResize}
                                      containerRef={topRowRef}
                                      direction="horizontal"
                                    />
                                  )}
                                {editorCount >= 2 && (
                                  <EditorCell key={editorKeys[1]} {...editorCellProps(1)} />
                                )}
                              </div>
                            )}
                            {/* Row divider */}
                            {!zenMode.isZenMode && bothRowsVisible && (
                              <Divider
                                onResize={handleRowResize}
                                containerRef={containerRef}
                                direction="vertical"
                              />
                            )}
                            {/* Bottom row */}
                            {bottomRowVisible && (
                              <div
                                ref={bottomRowRef}
                                className="flex flex-row min-w-0 min-h-0"
                                style={{
                                  flex: bothRowsVisible ? `${100 - rowSplit} 0 0%` : "1 0 0%",
                                }}
                              >
                                <EditorCell key={editorKeys[2]} {...editorCellProps(2)} />
                                {!zenMode.isZenMode &&
                                  editorCount >= 4 &&
                                  sectionVisibility[2] &&
                                  sectionVisibility[3] && (
                                    <Divider
                                      onResize={handleColumnResize}
                                      containerRef={bottomRowRef}
                                      direction="horizontal"
                                    />
                                  )}
                                {editorCount >= 4 && (
                                  <EditorCell key={editorKeys[3]} {...editorCellProps(3)} />
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()
                    : editorWidths.map((width, i) => {
                        const showDivider =
                          i > 0 && sectionVisibility[i - 1] && sectionVisibility[i];
                        const isPdf =
                          paneTypes[i]?.type === "pdf" &&
                          paneTypes[i]?.storageKey &&
                          paneTypes[i]?.filename;
                        return (
                          <Fragment key={editorKeys[i]}>
                            {showDivider && !zenMode.isZenMode && (
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
                              {!zenMode.isZenMode && (
                                <TextHeader
                                  name={docCtx.sectionNames[i]}
                                  index={i}
                                  onUpdateName={(name) => docCtx.updateSectionName(i, name)}
                                  onUploadPdf={(file) => handleUploadPdf(i, file)}
                                />
                              )}
                              {isPdf ? (
                                <div className="flex-1 min-h-0 overflow-hidden">
                                  <Suspense
                                    fallback={
                                      <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Loading...
                                      </div>
                                    }
                                  >
                                    <LazyPdfPane
                                      documentId={documentId}
                                      paneIndex={i}
                                      storageKey={paneTypes[i].storageKey!}
                                      filename={paneTypes[i].filename!}
                                      onRemove={() => handleRemovePdf(i)}
                                    />
                                  </Suspense>
                                </div>
                              ) : (
                                <div className="flex-1 min-h-0 overflow-hidden">
                                  <ErrorBoundary>
                                    <EditorPane
                                      isLocked={isPaneLocked(i) || effectiveReadOnly}
                                      activeTool={annotations.activeTool}
                                      content={PLACEHOLDER_CONTENT}
                                      index={i}
                                      fragment={docCtx.yjs.getFragment(i)}
                                      onEditorMount={handleEditorMount}
                                      onFocus={handlePaneFocus}
                                      onMouseDown={
                                        isPaneLocked(i) && !effectiveReadOnly
                                          ? handleMouseDown
                                          : undefined
                                      }
                                      onMouseMove={
                                        isPaneLocked(i) && !effectiveReadOnly
                                          ? handleMouseMove
                                          : undefined
                                      }
                                      onMouseUp={
                                        isPaneLocked(i) && !effectiveReadOnly
                                          ? handleMouseUp
                                          : undefined
                                      }
                                      layers={displayLayers}
                                      selection={selection}
                                      selectionHidden={selectionHidden}
                                      activeLayerColor={activeLayerColor}
                                      isDarkMode={docCtx.isDarkMode}
                                      removeArrow={removeArrow}
                                      sectionVisibility={sectionVisibility}
                                      selectedArrowId={docCtx.selectedArrow?.arrowId ?? null}
                                      yjsSynced={docCtx.readyForSeeding}
                                      overscroll={settings.overscroll}
                                    />
                                  </ErrorBoundary>
                                </div>
                              )}
                            </div>
                          </Fragment>
                        );
                      })}
                </div>
                {!isMobile &&
                  !zenMode.isZenMode &&
                  anyPaneLocked &&
                  ((settings.commentPlacement === "right" && hasAnyAnnotations) ||
                    (settings.commentPlacement === "both" && hasRightAnnotations)) && (
                    <>
                      {!rightPanelCollapsed && (
                        <div
                          role="separator"
                          data-testid="annotation-panel-divider"
                          onMouseDown={(e) => handleAnnotationPanelDrag(e, "right")}
                          className="flex flex-col items-center w-1.5 h-full cursor-col-resize hover:bg-accent transition-colors shrink-0"
                        >
                          <div className="flex-1 w-px bg-gray-300" />
                        </div>
                      )}
                      <ErrorBoundary silent>
                        <AnnotationPanel
                          {...annotationPanelProps}
                          placement="right"
                          width={annotationPanelWidth}
                          editorIndices={
                            settings.commentPlacement === "both" ? editorColumns.right : undefined
                          }
                          isCollapsed={rightPanelCollapsed}
                          onToggleCollapsed={() => setRightPanelCollapsed((v) => !v)}
                        />
                      </ErrorBoundary>
                    </>
                  )}
                <div className="hidden print:block w-56 flex-shrink-0 pl-4 print-annotations-container">
                  <PrintAnnotations
                    layers={layers}
                    sectionNames={docCtx.sectionNames}
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
            onEnterZenMode={handleEnterZenMode}
          />
        )}
        {/* Mobile annotation drawer: bottom panel with read-only annotation cards */}
        {isMobile && anyPaneLocked && hasAnyAnnotations && (
          <>
            {!mobileAnnotationPanelOpen && (
              <button
                data-testid="mobileAnnotationToggle"
                className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg px-3 py-2 text-sm"
                onClick={() => setMobileAnnotationPanelOpen(true)}
              >
                <MessageSquare size={16} />
                <span>Annotations</span>
              </button>
            )}
            {mobileAnnotationPanelOpen && (
              <div
                data-testid="mobileAnnotationDrawer"
                className="relative flex-shrink-0 border-t border-zinc-200 dark:border-zinc-700 bg-background"
                style={{ height: "40vh", minHeight: 200 }}
              >
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs font-medium text-muted-foreground">Annotations</span>
                  <button
                    data-testid="mobileAnnotationClose"
                    className="p-1 rounded hover:bg-accent text-muted-foreground"
                    onClick={() => setMobileAnnotationPanelOpen(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-2rem)]">
                  <ErrorBoundary silent>
                    <AnnotationPanel {...annotationPanelProps} placement="right" readOnly />
                  </ErrorBoundary>
                </div>
              </div>
            )}
          </>
        )}
        <MobileInfoDialog
          open={isMobile && !mobileDialogDismissed}
          onOpenChange={(open) => {
            if (!open) setMobileDialogDismissed(true);
          }}
        />
      </div>
    </DocumentProvider>
  );
}
