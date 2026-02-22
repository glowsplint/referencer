// Workspace settings dialog with toggle switches for dark mode, notification
// preferences (drawing/comments/highlight toasts), and overscroll behavior.
import { useTranslation } from "react-i18next";
import i18n, { LANGUAGE_OPTIONS } from "@/i18n";
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
  overscrollEnabled: boolean;
  toggleOverscrollEnabled: () => void;
  hideOffscreenArrows: boolean;
  toggleHideOffscreenArrows: () => void;
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
  overscrollEnabled,
  toggleOverscrollEnabled,
  hideOffscreenArrows,
  toggleHideOffscreenArrows,
}: SettingsDialogProps) {
  const { t } = useTranslation("dialogs");
  const { t: tc } = useTranslation("common");

  const rows: SettingsRow[] = [
    {
      id: "dark-mode",
      label: t("settings.darkMode.label"),
      description: t("settings.darkMode.description"),
      checked: isDarkMode,
      onCheckedChange: toggleDarkMode,
    },
    {
      id: "drawing-notifications",
      label: t("settings.drawingNotifications.label"),
      description: t("settings.drawingNotifications.description"),
      checked: showDrawingToasts,
      onCheckedChange: toggleShowDrawingToasts,
    },
    {
      id: "comments-notifications",
      label: t("settings.commentsNotifications.label"),
      description: t("settings.commentsNotifications.description"),
      checked: showCommentsToasts,
      onCheckedChange: toggleShowCommentsToasts,
    },
    {
      id: "highlight-notifications",
      label: t("settings.highlightNotifications.label"),
      description: t("settings.highlightNotifications.description"),
      checked: showHighlightToasts,
      onCheckedChange: toggleShowHighlightToasts,
    },
    {
      id: "overscroll",
      label: t("settings.overscroll.label"),
      description: t("settings.overscroll.description"),
      checked: overscrollEnabled,
      onCheckedChange: toggleOverscrollEnabled,
    },
    {
      id: "hide-offscreen-arrows",
      label: t("settings.hideOffscreenArrows.label"),
      description: t("settings.hideOffscreenArrows.description"),
      checked: hideOffscreenArrows,
      onCheckedChange: toggleHideOffscreenArrows,
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
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4 space-y-4">
          {rows.map((row) => (
            <SettingRow key={row.id} row={row} />
          ))}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="language" className="text-sm font-medium cursor-pointer">
                {t("settings.language.label")}
              </label>
              <p className="text-xs text-muted-foreground">{t("settings.language.description")}</p>
            </div>
            <select
              id="language"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              data-testid="language-select"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 border-t bg-background p-4">
          <DialogClose asChild>
            <Button variant="outline" data-testid="settingsCloseButton">
              {tc("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
