import { useTranslation } from "react-i18next";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import { useRecordingContext } from "@/contexts/RecordingContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { describeDelta } from "@/lib/recording/describe-delta";

export function RecordingStepBrowser() {
  const { t } = useTranslation("tools");
  const { recordings: rec, playback } = useRecordingContext();
  const { layers } = useWorkspace();

  const recording = rec.recordings.find((r) => r.id === playback.activeRecordingId);
  if (!playback.isPlaying || !recording) return null;

  const describe = (delta: Record<string, boolean>) =>
    describeDelta(delta, layers, t as unknown as (key: string, opts?: Record<string, unknown>) => string);

  const handleMoveStep = (fromIdx: number, direction: "up" | "down") => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= recording.steps.length) return;
    const newOrder = recording.steps.map((s) => s.id);
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    rec.reorderSteps(recording.id, newOrder);
  };

  const displayCurrent = playback.currentStepIndex + 2;
  const displayTotal = playback.totalSteps + 1;

  return (
    <div className="mt-4 border-t border-border pt-3" data-testid="recordingStepBrowser">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-medium text-muted-foreground truncate">{recording.name}</h3>
        <button
          onClick={playback.stopPlayback}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0 cursor-pointer"
          data-testid="stepBrowserClose"
        >
          <X size={14} />
        </button>
      </div>

      {/* Step list */}
      <div className="max-h-48 overflow-y-auto mb-2">
        {/* Initial state */}
        <button
          onClick={() => playback.goToStep(-1)}
          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left ${
            playback.currentStepIndex === -1 ? "bg-accent" : "hover:bg-accent/50"
          }`}
          data-testid="stepBrowserInitialState"
        >
          <span className="text-[10px] font-medium text-muted-foreground w-4 text-center shrink-0">0</span>
          <span className="text-xs truncate">{t("recording.initialState")}</span>
        </button>

        {recording.steps.map((step, idx) => (
          <div
            key={step.id}
            className={`group flex items-center gap-1.5 px-2 py-1 rounded ${
              playback.currentStepIndex === idx ? "bg-accent" : "hover:bg-accent/50"
            }`}
            data-testid={`stepBrowserStep-${step.id}`}
          >
            <button
              onClick={() => playback.goToStep(idx)}
              className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
            >
              <span className="text-[10px] font-medium text-muted-foreground w-4 text-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs truncate" title={describe(step.delta)}>
                {describe(step.delta)}
              </span>
            </button>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => handleMoveStep(idx, "up")}
                disabled={idx === 0}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                data-testid={`stepBrowserMoveUp-${step.id}`}
              >
                <ChevronUp size={10} />
              </button>
              <button
                onClick={() => handleMoveStep(idx, "down")}
                disabled={idx === recording.steps.length - 1}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                data-testid={`stepBrowserMoveDown-${step.id}`}
              >
                <ChevronDown size={10} />
              </button>
              <button
                onClick={() => rec.deleteStep(recording.id, step.id)}
                className="p-0.5 rounded hover:bg-accent text-destructive"
                data-testid={`stepBrowserDelete-${step.id}`}
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={playback.previousStep}
            disabled={playback.currentStepIndex <= -1}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-30"
            data-testid="stepBrowserPrevious"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={playback.toggleAutoPlay}
            className="p-1 rounded hover:bg-accent transition-colors"
            data-testid="stepBrowserToggleAutoPlay"
          >
            {playback.isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={playback.nextStep}
            disabled={playback.currentStepIndex >= playback.totalSteps - 1}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-30"
            data-testid="stepBrowserNext"
          >
            <SkipForward size={14} />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums" data-testid="stepBrowserCounter">
          {t("recording.stepOf", { current: displayCurrent, total: displayTotal })}
        </span>
      </div>

      {/* Settings */}
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-medium text-muted-foreground w-10 shrink-0">
            {t("recording.speed")}
          </label>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={recording.globalDelayMs}
            onChange={(e) =>
              rec.updateRecordingSettings(recording.id, {
                globalDelayMs: Number(e.target.value),
              })
            }
            className="flex-1 min-w-0"
            data-testid="stepBrowserDelaySlider"
          />
          <span className="text-[10px] tabular-nums w-8 text-right shrink-0">
            {(recording.globalDelayMs / 1000).toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-medium text-muted-foreground w-10 shrink-0">
            {t("recording.transition")}
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => rec.updateRecordingSettings(recording.id, { transitionType: "instant" })}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                recording.transitionType === "instant"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              data-testid="stepBrowserTransitionInstant"
            >
              {t("recording.instant")}
            </button>
            <button
              onClick={() => rec.updateRecordingSettings(recording.id, { transitionType: "fade" })}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                recording.transitionType === "fade"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              data-testid="stepBrowserTransitionFade"
            >
              {t("recording.fade")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
