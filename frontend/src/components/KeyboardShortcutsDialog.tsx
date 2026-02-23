// Modal dialog listing all keyboard shortcuts in a two-column layout.
// Covers workspace tools, text formatting, headings, lists, and alignment.
// Auto-detects macOS to show the correct modifier key symbol.
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const isMac = typeof navigator !== "undefined" && navigator.platform?.includes("Mac");
const CMD = isMac ? "\u2318" : "Ctrl";

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
          {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
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

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation("dialogs");

  const LEFT_SECTIONS: ShortcutSection[] = [
    {
      title: t("shortcuts.workspace"),
      shortcuts: [
        { keys: ["Tab"], description: t("shortcuts.cycleNextLayer") },
        { keys: ["Shift", "Tab"], description: t("shortcuts.cyclePrevLayer") },
        { keys: ["S"], description: t("shortcuts.selectionTool") },
        { keys: ["A"], description: t("shortcuts.arrowTool") },
        { keys: ["C"], description: t("shortcuts.commentsTool") },
        { keys: ["H"], description: t("shortcuts.highlightTool") },
        { keys: ["U"], description: t("shortcuts.underlineTool") },
        { keys: ["E"], description: t("shortcuts.eraserTool") },
        { keys: ["Arrow keys"], description: t("shortcuts.navigateWords") },
        { keys: ["`"], description: t("shortcuts.toggleConsole") },
        { keys: ["D"], description: t("shortcuts.toggleDarkMode") },
        { keys: ["R"], description: t("shortcuts.toggleLayout") },
        { keys: ["K"], description: t("shortcuts.toggleLock") },
        { keys: ["M"], description: t("shortcuts.toggleManagement") },
      ],
    },
    {
      title: t("shortcuts.textFormatting"),
      shortcuts: [
        { keys: [CMD, "B"], description: t("shortcuts.bold") },
        { keys: [CMD, "I"], description: t("shortcuts.italic") },
        { keys: [CMD, "U"], description: t("shortcuts.underline") },
        { keys: [CMD, "Shift", "S"], description: t("shortcuts.strikethrough") },
        { keys: [CMD, "E"], description: t("shortcuts.inlineCode") },
        { keys: [CMD, "."], description: t("shortcuts.superscript") },
        { keys: [CMD, ","], description: t("shortcuts.subscript") },
        { keys: [CMD, "Shift", "H"], description: t("shortcuts.colorHighlight") },
      ],
    },
    {
      title: t("shortcuts.general"),
      shortcuts: [
        { keys: [CMD, "Z"], description: t("shortcuts.undo") },
        { keys: [CMD, "Shift", "Z"], description: t("shortcuts.redo") },
      ],
    },
  ];

  const RIGHT_SECTIONS: ShortcutSection[] = [
    {
      title: t("shortcuts.headings"),
      shortcuts: [
        { keys: ["Ctrl", "Alt", "1"], description: t("shortcuts.heading", { level: 1 }) },
        { keys: ["Ctrl", "Alt", "2"], description: t("shortcuts.heading", { level: 2 }) },
        { keys: ["Ctrl", "Alt", "3"], description: t("shortcuts.heading", { level: 3 }) },
        { keys: ["Ctrl", "Alt", "4"], description: t("shortcuts.heading", { level: 4 }) },
        { keys: ["Ctrl", "Alt", "5"], description: t("shortcuts.heading", { level: 5 }) },
        { keys: ["Ctrl", "Alt", "6"], description: t("shortcuts.heading", { level: 6 }) },
      ],
    },
    {
      title: t("shortcuts.listsAndBlocks"),
      shortcuts: [
        { keys: [CMD, "Shift", "8"], description: t("shortcuts.bulletList") },
        { keys: [CMD, "Shift", "7"], description: t("shortcuts.orderedList") },
        { keys: [CMD, "Shift", "9"], description: t("shortcuts.taskList") },
        { keys: [CMD, "Shift", "B"], description: t("shortcuts.blockquote") },
        { keys: [CMD, "Alt", "C"], description: t("shortcuts.codeBlock") },
      ],
    },
    {
      title: t("shortcuts.textAlignment"),
      shortcuts: [
        { keys: [CMD, "Shift", "L"], description: t("shortcuts.alignLeft") },
        { keys: [CMD, "Shift", "E"], description: t("shortcuts.alignCenter") },
        { keys: [CMD, "Shift", "R"], description: t("shortcuts.alignRight") },
        { keys: [CMD, "Shift", "J"], description: t("shortcuts.alignJustify") },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 p-0 sm:max-w-2xl"
        data-testid="keyboardShortcutsDialog"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
