import type { TourStep } from "@/hooks/ui/use-tour-engine";

export const EDITOR_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-testid="editorContainer"]',
    title: "steps.editor.paste.title",
    content: "steps.editor.paste.content",
    centered: true,
  },
  {
    target: '[data-testid="lockButton"]',
    title: "steps.editor.lock.title",
    content: "steps.editor.lock.content",
    placement: "right",
  },
  {
    target: '[data-testid="annotationToolGroup"]',
    title: "steps.editor.annotate.title",
    content: "steps.editor.annotate.content",
    placement: "right",
  },
  {
    target: '[data-testid="managementPane"]',
    title: "steps.editor.layers.title",
    content: "steps.editor.layers.content",
    placement: "right",
    onEnter: "pulseTrashBin",
    onExit: "unpulseTrashBin",
  },
  {
    target: '[data-testid="status-bar"]',
    title: "steps.editor.statusBar.title",
    content: "steps.editor.statusBar.content",
    placement: "bottom",
  },
  {
    target: '[data-testid="shareDialog"]',
    title: "steps.editor.share.title",
    content: "steps.editor.share.content",
    placement: "bottom",
    onEnter: "openShareDialog",
    onExit: "closeShareDialog",
  },
];
