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
import { Switch } from "@/components/ui/switch";

interface SettingsRow {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}

function SettingRow({ row }: { row: SettingsRow }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <label htmlFor={row.id} className="text-sm font-medium cursor-pointer">
          {row.label}
        </label>
        <p className="text-xs text-muted-foreground">{row.description}</p>
      </div>
      <Switch
        id={row.id}
        checked={row.checked}
        onCheckedChange={row.onCheckedChange}
        data-testid={`${row.id}-switch`}
      />
    </div>
  );
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showDrawingToasts: boolean;
  toggleShowDrawingToasts: () => void;
  showCommentsToasts: boolean;
  toggleShowCommentsToasts: () => void;
  showHighlightToasts: boolean;
  toggleShowHighlightToasts: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  isDarkMode,
  toggleDarkMode,
  showDrawingToasts,
  toggleShowDrawingToasts,
  showCommentsToasts,
  toggleShowCommentsToasts,
  showHighlightToasts,
  toggleShowHighlightToasts,
}: SettingsDialogProps) {
  const rows: SettingsRow[] = [
    {
      id: "dark-mode",
      label: "Dark mode",
      description: "Switch between light and dark themes",
      checked: isDarkMode,
      onCheckedChange: toggleDarkMode,
    },
    {
      id: "drawing-notifications",
      label: "Drawing notifications",
      description: "Show toasts when using the arrow tool",
      checked: showDrawingToasts,
      onCheckedChange: toggleShowDrawingToasts,
    },
    {
      id: "comments-notifications",
      label: "Comments notifications",
      description: "Show toasts when using the comments tool",
      checked: showCommentsToasts,
      onCheckedChange: toggleShowCommentsToasts,
    },
    {
      id: "highlight-notifications",
      label: "Highlight notifications",
      description: "Show toasts when using the highlight tool",
      checked: showHighlightToasts,
      onCheckedChange: toggleShowHighlightToasts,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 sm:max-w-sm"
        data-testid="settingsDialog"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your workspace preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4 space-y-4">
          {rows.map((row) => (
            <SettingRow key={row.id} row={row} />
          ))}
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background p-4">
          <DialogClose asChild>
            <Button variant="outline" data-testid="settingsCloseButton">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
