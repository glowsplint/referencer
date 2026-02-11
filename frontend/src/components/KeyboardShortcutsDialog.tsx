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

const CMD = "\u2318";

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
      { keys: [CMD, "B"], description: "Bold" },
      { keys: [CMD, "I"], description: "Italic" },
      { keys: [CMD, "U"], description: "Underline" },
      { keys: [CMD, "Shift", "S"], description: "Strikethrough" },
      { keys: [CMD, "E"], description: "Inline code" },
      { keys: [CMD, "."], description: "Superscript" },
      { keys: [CMD, ","], description: "Subscript" },
      { keys: [CMD, "Shift", "H"], description: "Color highlight" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: [CMD, "Z"], description: "Undo" },
      { keys: [CMD, "Shift", "Z"], description: "Redo" },
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
      { keys: [CMD, "Shift", "8"], description: "Bullet list" },
      { keys: [CMD, "Shift", "7"], description: "Ordered list" },
      { keys: [CMD, "Shift", "9"], description: "Task list" },
      { keys: [CMD, "Shift", "B"], description: "Blockquote" },
      { keys: [CMD, "Alt", "C"], description: "Code block" },
    ],
  },
  {
    title: "Text Alignment",
    shortcuts: [
      { keys: [CMD, "Shift", "L"], description: "Align left" },
      { keys: [CMD, "Shift", "E"], description: "Align center" },
      { keys: [CMD, "Shift", "R"], description: "Align right" },
      { keys: [CMD, "Shift", "J"], description: "Align justify" },
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

function KeyCombination({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-xs text-muted-foreground">+</span>
          )}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutEntry }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{shortcut.description}</span>
      <KeyCombination keys={shortcut.keys} />
    </div>
  );
}

function ShortcutGroup({ section }: { section: ShortcutSection }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {section.title}
      </h3>
      <div className="space-y-2">
        {section.shortcuts.map((shortcut) => (
          <ShortcutRow key={shortcut.description} shortcut={shortcut} />
        ))}
      </div>
    </div>
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
                  <ShortcutGroup key={section.title} section={section} />
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
