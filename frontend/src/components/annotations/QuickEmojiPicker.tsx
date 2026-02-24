import { QUICK_EMOJIS } from "@/constants/emojis";

interface QuickEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onOpenFull: () => void;
}

/** Inline row of 8 quick-pick emoji buttons plus a "+" button to open the full picker. */
export function QuickEmojiPicker({
  onSelect,
  onOpenFull,
}: QuickEmojiPickerProps) {
  return (
    <div className="inline-flex items-center gap-0.5 px-2 py-0.5">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
        >
          {emoji}
        </button>
      ))}
      <button
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors text-xs text-zinc-400"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFull();
        }}
        title="More emojis"
      >
        +
      </button>
    </div>
  );
}
