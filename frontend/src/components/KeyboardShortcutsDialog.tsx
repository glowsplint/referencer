import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const LEFT_SECTIONS: ShortcutSection[] = [
  {
    title: "Workspace",
    shortcuts: [
      { keys: ["L"], description: "Cycle to next layer" },
      { keys: ["A"], description: "Hold to draw arrow" },
      { keys: ["Arrow keys"], description: "Navigate between words" },
    ],
  },
  {
    title: "Text Formatting",
    shortcuts: [
      { keys: ["\u2318", "B"], description: "Bold" },
      { keys: ["\u2318", "I"], description: "Italic" },
      { keys: ["\u2318", "U"], description: "Underline" },
      { keys: ["\u2318", "Shift", "S"], description: "Strikethrough" },
      { keys: ["\u2318", "E"], description: "Inline code" },
      { keys: ["\u2318", "."], description: "Superscript" },
      { keys: ["\u2318", ","], description: "Subscript" },
      { keys: ["\u2318", "Shift", "H"], description: "Color highlight" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["\u2318", "Z"], description: "Undo" },
      { keys: ["\u2318", "Shift", "Z"], description: "Redo" },
    ],
  },
];

const RIGHT_SECTIONS: ShortcutSection[] = [
  {
    title: "Headings",
    shortcuts: [
      { keys: ["Ctrl", "Alt", "1"], description: "Heading 1" },
      { keys: ["Ctrl", "Alt", "2"], description: "Heading 2" },
      { keys: ["Ctrl", "Alt", "3"], description: "Heading 3" },
      { keys: ["Ctrl", "Alt", "4"], description: "Heading 4" },
      { keys: ["Ctrl", "Alt", "5"], description: "Heading 5" },
      { keys: ["Ctrl", "Alt", "6"], description: "Heading 6" },
    ],
  },
  {
    title: "Lists & Blocks",
    shortcuts: [
      { keys: ["\u2318", "Shift", "8"], description: "Bullet list" },
      { keys: ["\u2318", "Shift", "7"], description: "Ordered list" },
      { keys: ["\u2318", "Shift", "9"], description: "Task list" },
      { keys: ["\u2318", "Shift", "B"], description: "Blockquote" },
      { keys: ["\u2318", "Alt", "C"], description: "Code block" },
    ],
  },
  {
    title: "Text Alignment",
    shortcuts: [
      { keys: ["\u2318", "Shift", "L"], description: "Align left" },
      { keys: ["\u2318", "Shift", "E"], description: "Align center" },
      { keys: ["\u2318", "Shift", "R"], description: "Align right" },
      { keys: ["\u2318", "Shift", "J"], description: "Align justify" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded-sm border bg-muted px-1.5 py-0.5 text-xs font-mono font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 sm:max-w-2xl"
        data-testid="keyboardShortcutsDialog"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Available keyboard shortcuts for the workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="px-6 pb-4 grid grid-cols-2 gap-x-8">
            {[LEFT_SECTIONS, RIGHT_SECTIONS].map((column, colIdx) => (
              <div key={colIdx} className="space-y-5">
                {column.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.description}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <span
                                key={i}
                                className="flex items-center gap-1"
                              >
                                {i > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    +
                                  </span>
                                )}
                                <Kbd>{key}</Kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background p-4">
          <DialogClose asChild>
            <Button variant="outline" data-testid="shortcutsCloseButton">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
