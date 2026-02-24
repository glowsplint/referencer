import * as Popover from "@radix-ui/react-popover";
import { EMOJI_CATEGORIES } from "@/constants/emojis";

interface EmojiPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
  children: React.ReactNode;
}

/** Full emoji grid in a popover, organized by category. */
export function EmojiPickerPopover({
  open,
  onOpenChange,
  onSelect,
  children,
}: EmojiPickerPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-64 max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white p-2 shadow-md dark:border-zinc-700 dark:bg-zinc-800"
          side="bottom"
          align="start"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.label} className="mb-2 last:mb-0">
              <div className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1 px-0.5">
                {category.label}
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent transition-colors text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(emoji);
                      onOpenChange(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
