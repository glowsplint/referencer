// Floating playback control bar shown at the bottom-center of the editor
// during recording playback. Provides step navigation, autoplay toggle,
// and keyboard shortcuts (arrows, space, escape).
import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import { useRecordingContext } from "@/contexts/RecordingContext";

export function PlaybackBar() {
  const { t } = useTranslation("tools");
  const { recordings: rec, playback } = useRecordingContext();

  const recording = rec.recordings.find((r) => r.id === playback.activeRecordingId);

  // Keyboard shortcuts during playback
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!playback.isPlaying) return;

      // Don't capture if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          playback.previousStep();
          break;
        case "ArrowRight":
          e.preventDefault();
          playback.nextStep();
          break;
        case " ":
          e.preventDefault();
          playback.toggleAutoPlay();
          break;
        case "Escape":
          e.preventDefault();
          playback.stopPlayback();
          break;
      }
    },
    [playback],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!playback.isPlaying || !recording) return null;

  // currentStepIndex is -1 for initial state, so display as 1-indexed
  const displayCurrent = playback.currentStepIndex + 2; // +1 for initial state, +1 for 1-based
  const displayTotal = playback.totalSteps + 1; // +1 for initial state

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg"
      data-testid="playbackBar"
    >
      {/* Recording name */}
      <span className="text-sm font-medium truncate max-w-40">{recording.name}</span>

      <div className="w-px h-4 bg-border" />

      {/* Previous step */}
      <Tooltip placement="top">
        <TooltipTrigger asChild>
          <button
            onClick={playback.previousStep}
            disabled={playback.currentStepIndex <= -1}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-30"
            data-testid="playbackPrevious"
          >
            <SkipBack size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {t("recording.previous")} <kbd>&larr;</kbd>
        </TooltipContent>
      </Tooltip>

      {/* Play / Pause */}
      <Tooltip placement="top">
        <TooltipTrigger asChild>
          <button
            onClick={playback.toggleAutoPlay}
            className="p-1 rounded hover:bg-accent transition-colors"
            data-testid="playbackToggleAutoPlay"
          >
            {playback.isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {playback.isAutoPlaying ? t("recording.pause") : t("recording.play")} <kbd>Space</kbd>
        </TooltipContent>
      </Tooltip>

      {/* Next step */}
      <Tooltip placement="top">
        <TooltipTrigger asChild>
          <button
            onClick={playback.nextStep}
            disabled={playback.currentStepIndex >= playback.totalSteps - 1}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-30"
            data-testid="playbackNext"
          >
            <SkipForward size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {t("recording.next")} <kbd>&rarr;</kbd>
        </TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border" />

      {/* Step counter */}
      <span className="text-xs text-muted-foreground tabular-nums" data-testid="playbackStepCounter">
        {t("recording.stepOf", { current: displayCurrent, total: displayTotal })}
      </span>

      {/* Warning indicator */}
      {playback.hasWarnings && (
        <Tooltip placement="top">
          <TooltipTrigger asChild>
            <span className="text-amber-500" data-testid="playbackWarning">
              <AlertTriangle size={14} />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("recording.deletedAnnotationWarning")}</TooltipContent>
        </Tooltip>
      )}

      <div className="w-px h-4 bg-border" />

      {/* Stop playback */}
      <Tooltip placement="top">
        <TooltipTrigger asChild>
          <button
            onClick={playback.stopPlayback}
            className="p-1 rounded hover:bg-accent transition-colors"
            data-testid="playbackStop"
          >
            <X size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {t("recording.stop")} <kbd>Esc</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
