// Types for the recording/playback feature: visibility recordings
// that capture sequences of layer/annotation/section show/hide steps.

export interface VisibilityDelta {
  [targetKey: string]: boolean;
}

export interface VisibilitySnapshot {
  layers: Record<string, boolean>;
  annotations: Record<string, boolean>;
  sections: Record<number, boolean>;
}

export interface RecordingStep {
  id: string;
  delta: VisibilityDelta;
}

export type TransitionType = "instant" | "fade";

export interface Recording {
  id: string;
  name: string;
  initialState: VisibilitySnapshot;
  steps: RecordingStep[];
  globalDelayMs: number;
  transitionType: TransitionType;
  createdAt: number;
  updatedAt: number;
}
