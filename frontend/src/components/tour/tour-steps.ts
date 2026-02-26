import type { TourStep } from "@/hooks/ui/use-tour-engine";

export const EDITOR_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-testid="editorContainer"]',
    title: "steps.editor.paste.title",
    content: "steps.editor.paste.content",
    image: "/tour/editor-paste.gif",
    centered: true,
  },
  {
    target: '[data-testid="lockButton"]',
    title: "steps.editor.lock.title",
    content: "steps.editor.lock.content",
    image: "/tour/editor-lock.gif",
    placement: "right",
  },
  {
    target: '[data-testid="commentsToolButton"]',
    title: "steps.editor.annotate.title",
    content: "steps.editor.annotate.content",
    image: "/tour/editor-annotate.gif",
    placement: "right",
  },
  {
    target: '[data-testid="lockButton"]',
    title: "steps.editor.unlock.title",
    content: "steps.editor.unlock.content",
    image: "/tour/editor-unlock.gif",
    placement: "right",
  },
  {
    target: '[data-testid="status-bar"]',
    title: "steps.editor.statusBar.title",
    content: "steps.editor.statusBar.content",
    placement: "bottom",
  },
];
