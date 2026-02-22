import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pencil, Trash2, Copy, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import type { Recording } from "@/types/recording";

interface RecordingListItemProps {
  recording: Recording;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function RecordingListItem({
  recording,
  onPlay,
  onEdit,
  onRename,
  onDelete,
  onDuplicate,
}: RecordingListItemProps) {
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
          <button onClick={() => setIsRenaming(false)} className="p-0.5 rounded hover:bg-accent">
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
