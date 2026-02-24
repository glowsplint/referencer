// Recording controls in the ButtonPane toolbar. Shows a record button and
// a dropdown to manage recordings (play, edit, rename, delete, duplicate).
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Circle, Square, Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import { useRecordingContext } from "@/contexts/RecordingContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { RecordingListItem } from "./recording/RecordingListItem";

export function RecordingControls() {
  const { t } = useTranslation("tools");
  const { recordings: rec, playback } = useRecordingContext();
  const { readOnly } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
            <p className="text-xs text-muted-foreground px-2 py-2">{t("recording.noRecordings")}</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {rec.recordings.map((recording) => (
                <RecordingListItem
                  key={recording.id}
                  recording={recording}
                  onPlay={handlePlay}
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
    </div>
  );
}
