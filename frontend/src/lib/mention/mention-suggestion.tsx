import { ReactRenderer } from "@tiptap/react";
import { MentionSuggestionList } from "@/components/annotations/MentionSuggestionList";
import type { MentionSuggestionListRef } from "@/components/annotations/MentionSuggestionList";
import type { SuggestionProps } from "@tiptap/suggestion";

export function createMentionSuggestionRenderer() {
  let component: ReactRenderer<MentionSuggestionListRef> | null = null;
  let popup: HTMLDivElement | null = null;

  return {
    onStart: (props: SuggestionProps) => {
      popup = document.createElement("div");
      popup.style.position = "fixed";
      popup.style.zIndex = "9999";
      document.body.appendChild(popup);

      component = new ReactRenderer(MentionSuggestionList, {
        props: {
          items: props.items,
          command: props.command,
        },
        editor: props.editor,
      });

      if (component.element && popup) {
        popup.appendChild(component.element);
      }

      updatePosition(props, popup);
    },
    onUpdate: (props: SuggestionProps) => {
      component?.updateProps({
        items: props.items,
        command: props.command,
      });
      if (popup) updatePosition(props, popup);
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.remove();
        component?.destroy();
        popup = null;
        component = null;
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      popup?.remove();
      component?.destroy();
      popup = null;
      component = null;
    },
  };
}

function updatePosition(props: SuggestionProps, popup: HTMLDivElement) {
  const rect = props.clientRect?.();
  if (!rect) return;
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 4}px`;
}
