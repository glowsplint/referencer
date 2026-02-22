// Recording controls in the ButtonPane toolbar. Shows a record button and
// a dropdown to manage recordings (play, edit, rename, delete, duplicate).
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Circle,
  Square,
  Play,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import { useRecordingContext } from "@/contexts/RecordingContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Recording } from "@/types/recording";

function RecordingListItem({
  recording,
  onPlay,
  onEdit,
  onRename,
  onDelete,
  onDuplicate,
}: {
  recording: Recording;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const { t } = useTranslation("tools");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(recording.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== recording.name) {
      onRename(recording.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, recording.id, recording.name, onRename]);

  return (
    <div
      className="group flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/50"
      data-testid={`recordingItem-${recording.id}`}
    >
      {isRenaming ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            onBlur={commitRename}
            className="text-xs bg-transparent border-0 ring-1 ring-border rounded px-1 py-0 outline-none flex-1 min-w-0"
            data-testid={`recordingRenameInput-${recording.id}`}
          />
          <button
            onClick={commitRename}
            className="p-0.5 rounded hover:bg-accent"
            data-testid={`recordingRenameConfirm-${recording.id}`}
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => setIsRenaming(false)}
            className="p-0.5 rounded hover:bg-accent"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => onPlay(recording.id)}
            className="flex-1 min-w-0 text-left"
            data-testid={`recordingPlay-${recording.id}`}
          >
            <span className="text-xs truncate block">{recording.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {recording.steps.length} {recording.steps.length === 1 ? "step" : "steps"}
            </span>
          </button>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip placement="top">
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPlay(recording.id)}
                  className="p-0.5 rounded hover:bg-accent"
                  data-testid={`recordingPlayBtn-${recording.id}`}
                >
                  <Play size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("recording.play")}</TooltipContent>
            </Tooltip>
            <Tooltip placement="top">
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEdit(recording.id)}
                  className="p-0.5 rounded hover:bg-accent"
                  data-testid={`recordingEditBtn-${recording.id}`}
                >
                  <Pencil size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("recording.editRecording")}</TooltipContent>
            </Tooltip>
            <Tooltip placement="top">
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setRenameValue(recording.name);
                    setIsRenaming(true);
                  }}
                  className="p-0.5 rounded hover:bg-accent"
                  data-testid={`recordingRenameBtn-${recording.id}`}
                >
                  <Pencil size={12} className="text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Rename</TooltipContent>
            </Tooltip>
            <Tooltip placement="top">
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDuplicate(recording.id)}
                  className="p-0.5 rounded hover:bg-accent"
                  data-testid={`recordingDuplicateBtn-${recording.id}`}
                >
                  <Copy size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("recording.duplicateRecording")}</TooltipContent>
            </Tooltip>
            <Tooltip placement="top">
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDelete(recording.id)}
                  className="p-0.5 rounded hover:bg-accent text-destructive"
                  data-testid={`recordingDeleteBtn-${recording.id}`}
                >
                  <Trash2 size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("recording.deleteRecording")}</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
}

export function RecordingControls() {
  const { t } = useTranslation("tools");
  const { recordings: rec, playback } = useRecordingContext();
  const { readOnly, settings } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingRecordingId, setEditingRecordingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleToggleRecord = useCallback(() => {
    if (rec.isRecording) {
      rec.stopRecording();
    } else {
      // Create a new recording and start recording into it
      const name = t("recording.untitled");
      const id = rec.createRecording(name);
      if (id) rec.startRecording(id);
    }
  }, [rec, t]);

  const handlePlay = useCallback(
    (id: string) => {
      playback.startPlayback(id);
      setDropdownOpen(false);
    },
    [playback],
  );

  const handleNewRecording = useCallback(() => {
    const name = t("recording.untitled");
    const id = rec.createRecording(name);
    if (id) {
      rec.startRecording(id);
      setDropdownOpen(false);
    }
  }, [rec, t]);

  const handleEdit = useCallback((id: string) => {
    setEditingRecordingId(id);
  }, []);

  const disabled = readOnly || playback.isPlaying;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-col items-center gap-1">
        {/* Record / Stop button */}
        <Tooltip placement="right">
          <TooltipTrigger asChild>
            <button
              onClick={handleToggleRecord}
              disabled={disabled}
              className={`p-2 rounded-md transition-colors ${
                rec.isRecording
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "hover:bg-accent hover:text-accent-foreground"
              } disabled:opacity-40 disabled:pointer-events-none`}
              data-testid="recordButton"
            >
              {rec.isRecording ? (
                <Square size={20} className="animate-pulse" />
              ) : (
                <Circle size={20} className="text-red-500" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {rec.isRecording ? t("recording.stopRecording") : t("recording.record")}
          </TooltipContent>
        </Tooltip>

        {/* Dropdown toggle */}
        <Tooltip placement="right">
          <TooltipTrigger asChild>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              disabled={readOnly}
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              data-testid="recordingDropdownToggle"
            >
              {dropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("recording.label")}</TooltipContent>
        </Tooltip>
      </div>

      {/* Dropdown panel */}
      {dropdownOpen && (
        <div
          className="absolute left-full top-0 ml-1 z-50 w-56 rounded-md border border-border bg-popover shadow-lg p-1"
          data-testid="recordingDropdown"
        >
          {rec.recordings.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-2">
              {t("recording.noRecordings")}
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {rec.recordings.map((recording) => (
                <RecordingListItem
                  key={recording.id}
                  recording={recording}
                  onPlay={handlePlay}
                  onEdit={handleEdit}
                  onRename={rec.renameRecording}
                  onDelete={rec.deleteRecording}
                  onDuplicate={rec.duplicateRecording}
                />
              ))}
            </div>
          )}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={handleNewRecording}
              disabled={rec.isRecording}
              className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-accent/50 disabled:opacity-40"
              data-testid="newRecordingButton"
            >
              <Plus size={14} />
              {t("recording.newRecording")}
            </button>
          </div>
        </div>
      )}

      {/* Recording Editor Modal */}
      {editingRecordingId && (
        <RecordingEditorModal
          recordingId={editingRecordingId}
          onClose={() => setEditingRecordingId(null)}
        />
      )}
    </div>
  );
}

// Inline recording editor modal (avoids circular import with separate file)
function RecordingEditorModal({
  recordingId,
  onClose,
}: {
  recordingId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation("tools");
  const { recordings: rec } = useRecordingContext();
  const { layers } = useWorkspace();

  const recording = rec.recordings.find((r) => r.id === recordingId);
  if (!recording) return null;

  function describeDelta(delta: Record<string, boolean>): string {
    const parts: string[] = [];
    for (const [key, visible] of Object.entries(delta)) {
      if (key.startsWith("layer:")) {
        const id = key.slice("layer:".length);
        const name = layers.find((l) => l.id === id)?.name ?? "Unknown";
        parts.push(
          visible
            ? t("recording.showLayer", { name })
            : t("recording.hideLayer", { name }),
        );
      } else if (key.startsWith("section:")) {
        const idx = Number(key.slice("section:".length));
        parts.push(
          visible
            ? t("recording.showSection", { index: idx + 1 })
            : t("recording.hideSection", { index: idx + 1 }),
        );
      } else {
        parts.push(visible ? t("recording.showAnnotation") : t("recording.hideAnnotation"));
      }
    }
    return parts.join(", ") || "No changes";
  }

  const handleMoveStep = (fromIdx: number, direction: "up" | "down") => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= recording.steps.length) return;
    const newOrder = recording.steps.map((s) => s.id);
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    rec.reorderSteps(recordingId, newOrder);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="recordingEditorModal"
    >
      <div className="bg-popover border border-border rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">{recording.name}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent"
            data-testid="recordingEditorClose"
          >
            <X size={16} />
          </button>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Initial state */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/30 mb-1">
            <span className="text-xs font-medium text-muted-foreground w-6 text-center">0</span>
            <span className="text-xs flex-1">{t("recording.initialState")}</span>
          </div>

          {recording.steps.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-2">
              {t("recording.noRecordings")}
            </p>
          ) : (
            recording.steps.map((step, idx) => (
              <div
                key={step.id}
                className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/30"
                data-testid={`recordingStep-${step.id}`}
              >
                <span className="text-xs font-medium text-muted-foreground w-6 text-center">
                  {idx + 1}
                </span>
                <span className="text-xs flex-1 truncate" title={describeDelta(step.delta)}>
                  {describeDelta(step.delta)}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveStep(idx, "up")}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                    data-testid={`stepMoveUp-${step.id}`}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMoveStep(idx, "down")}
                    disabled={idx === recording.steps.length - 1}
                    className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                    data-testid={`stepMoveDown-${step.id}`}
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => rec.deleteStep(recordingId, step.id)}
                    className="p-0.5 rounded hover:bg-accent text-destructive"
                    data-testid={`stepDelete-${step.id}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Settings */}
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Delay slider */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground w-16">
              {t("recording.speed")}
            </label>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={recording.globalDelayMs}
              onChange={(e) =>
                rec.updateRecordingSettings(recordingId, {
                  globalDelayMs: Number(e.target.value),
                })
              }
              className="flex-1"
              data-testid="recordingDelaySlider"
            />
            <span className="text-xs tabular-nums w-12 text-right">
              {(recording.globalDelayMs / 1000).toFixed(1)}s
            </span>
          </div>

          {/* Transition type */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground w-16">
              {t("recording.transition")}
            </label>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  rec.updateRecordingSettings(recordingId, { transitionType: "instant" })
                }
                className={`px-2 py-0.5 rounded text-xs ${
                  recording.transitionType === "instant"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                data-testid="transitionInstant"
              >
                {t("recording.instant")}
              </button>
              <button
                onClick={() =>
                  rec.updateRecordingSettings(recordingId, { transitionType: "fade" })
                }
                className={`px-2 py-0.5 rounded text-xs ${
                  recording.transitionType === "fade"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                data-testid="transitionFade"
              >
                {t("recording.fade")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
