import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

interface MentionSuggestionListProps {
  items: { id: string; label: string }[];
  command: (item: { id: string; label: string }) => void;
}

export interface MentionSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionSuggestionList = forwardRef<
  MentionSuggestionListRef,
  MentionSuggestionListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[selectedIndex]) {
          command(items[selectedIndex]);
        }
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-md">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={`flex w-full items-center rounded-md px-2 py-1 text-xs text-left transition-colors ${
            index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
          }`}
          onClick={() => command(item)}
        >
          @{item.label}
        </button>
      ))}
    </div>
  );
});

MentionSuggestionList.displayName = "MentionSuggestionList";
