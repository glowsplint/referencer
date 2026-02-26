import { render } from "@testing-library/react";
import { vi } from "vitest";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { RecordingProvider } from "@/contexts/RecordingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TourProvider } from "@/contexts/TourContext";
import type { WorkspaceContextValue } from "@/contexts/WorkspaceContext";
import type { RecordingContextValue } from "@/contexts/RecordingContext";

export function makeMockWorkspace(
  overrides: Partial<WorkspaceContextValue> = {},
): WorkspaceContextValue {
  return {
    settings: {
      isDarkMode: false,
      isLayersOn: false,
      isMultipleRowsLayout: false,
      isLocked: false,
      overscrollEnabled: false,
      hideOffscreenArrows: false,
      showStatusBar: true,
      commentPlacement: "right" as const,
      thirdEditorFullWidth: true,
    },
    annotations: { activeTool: "selection" as const },
    layers: [],
    activeLayerId: null,
    editorCount: 1,
    activeEditor: null,
    editorWidths: [100],
    workspaceId: "test-workspace-id",
    readOnly: false,
    isManagementPaneOpen: false,
    toggleDarkMode: vi.fn(),
    toggleLayersOn: vi.fn(),
    toggleMultipleRowsLayout: vi.fn(),
    toggleLocked: vi.fn(),
    activeArrowStyle: "solid" as const,
    setActiveArrowStyle: vi.fn(),
    arrowStylePickerOpen: false,
    setArrowStylePickerOpen: vi.fn(),
    selectedArrow: null,
    setSelectedArrow: vi.fn(),
    updateArrowStyle: vi.fn(),
    setActiveTool: vi.fn(),
    toggleManagementPane: vi.fn(),
    toggleOverscrollEnabled: vi.fn(),
    toggleHideOffscreenArrows: vi.fn(),
    toggleShowStatusBar: vi.fn(),
    toggleCommentPlacement: vi.fn(),
    toggleThirdEditorFullWidth: vi.fn(),
    columnSplit: 50,
    rowSplit: 50,
    handleColumnResize: vi.fn(),
    handleRowResize: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    updateLayerColor: vi.fn(),
    updateLayerName: vi.fn(),
    toggleLayerVisibility: vi.fn(),
    toggleAllLayerVisibility: vi.fn(),
    addHighlight: vi.fn(),
    removeHighlight: vi.fn(),
    removeArrow: vi.fn(),
    clearLayerHighlights: vi.fn(),
    clearLayerArrows: vi.fn(),
    clearLayerUnderlines: vi.fn(),
    addArrow: vi.fn(),
    updateHighlightAnnotation: vi.fn(),
    addReply: vi.fn(),
    updateReply: vi.fn(),
    removeReply: vi.fn(),
    toggleReactionOnHighlight: vi.fn(),
    toggleReactionOnReply: vi.fn(),
    addUnderline: vi.fn(),
    removeUnderline: vi.fn(),
    toggleHighlightVisibility: vi.fn(),
    toggleArrowVisibility: vi.fn(),
    toggleUnderlineVisibility: vi.fn(),
    setActiveLayerId: vi.fn(),
    editorKeys: [1],
    editorsRef: { current: new Map() },
    sectionVisibility: [true],
    sectionNames: ["Passage 1"],
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    reorderEditors: vi.fn(),
    updateSectionName: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
    handleDividerResize: vi.fn(),
    handleEditorMount: vi.fn(),
    handlePaneFocus: vi.fn(),
    history: {
      log: [],
      canUndo: false,
      canRedo: false,
      undo: vi.fn(),
      redo: vi.fn(),
      record: vi.fn(),
    },
    wsConnected: false,
    yjs: {
      provider: null,
      doc: null,
      connected: false,
      synced: false,
      getFragment: () => null,
      awareness: null,
    },
    unifiedUndo: {
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    },
    ...overrides,
  } as WorkspaceContextValue;
}

export function makeMockRecordingContext(): RecordingContextValue {
  return {
    recordings: {
      recordings: [],
      isRecording: false,
      activeRecordingId: null,
      createRecording: vi.fn(() => ""),
      deleteRecording: vi.fn(),
      renameRecording: vi.fn(),
      duplicateRecording: vi.fn(() => ""),
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      deleteStep: vi.fn(),
      reorderSteps: vi.fn(),
      updateRecordingSettings: vi.fn(),
    },
    playback: {
      isPlaying: false,
      isAutoPlaying: false,
      activeRecordingId: null,
      currentStepIndex: -1,
      totalSteps: 0,
      startPlayback: vi.fn(),
      stopPlayback: vi.fn(),
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      goToStep: vi.fn(),
      toggleAutoPlay: vi.fn(),
      currentSnapshot: null,
      hasWarnings: false,
    },
  };
}

export function renderWithWorkspace(
  ui: React.ReactElement,
  overrides: Partial<WorkspaceContextValue> = {},
) {
  const workspace = makeMockWorkspace(overrides);
  const recordingContext = makeMockRecordingContext();
  return {
    ...render(
      <AuthProvider>
        <TourProvider>
          <WorkspaceProvider value={workspace}>
            <RecordingProvider value={recordingContext}>{ui}</RecordingProvider>
          </WorkspaceProvider>
        </TourProvider>
      </AuthProvider>,
    ),
    workspace,
  };
}
