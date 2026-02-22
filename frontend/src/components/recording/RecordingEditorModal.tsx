import { useTranslation } from "react-i18next";
import { Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useRecordingContext } from "@/contexts/RecordingContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { describeDelta } from "@/lib/recording/describe-delta";

interface RecordingEditorModalProps {
  recordingId: string;
  onClose: () => void;
}

export function RecordingEditorModal({ recordingId, onClose }: RecordingEditorModalProps) {
  const { t } = useTranslation("tools");
  const { recordings: rec } = useRecordingContext();
  const { layers } = useWorkspace();

  const recording = rec.recordings.find((r) => r.id === recordingId);
  if (!recording) return null;

  const describe = (delta: Record<string, boolean>) =>
    describeDelta(delta, layers, t as unknown as (key: string, opts?: Record<string, unknown>) => string);

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
                <span className="text-xs flex-1 truncate" title={describe(step.delta)}>
                  {describe(step.delta)}
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
