// Workspace settings dialog with toggle switches for dark mode, overscroll
// behavior, arrow visibility, and status bar.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bug } from "lucide-react";
import i18n, { LANGUAGE_OPTIONS } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BugReportDialog } from "./BugReportDialog";

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
  overscrollEnabled: boolean;
  toggleOverscrollEnabled: () => void;
  hideOffscreenArrows: boolean;
  toggleHideOffscreenArrows: () => void;
  showStatusBar: boolean;
  toggleShowStatusBar: () => void;
  isAuthenticated?: boolean;
}

export function SettingsDialog({
  open,
  onOpenChange,
  isDarkMode,
  toggleDarkMode,
  overscrollEnabled,
  toggleOverscrollEnabled,
  hideOffscreenArrows,
  toggleHideOffscreenArrows,
  showStatusBar,
  toggleShowStatusBar,
  isAuthenticated,
}: SettingsDialogProps) {
  const { t } = useTranslation("dialogs");
  const [bugReportOpen, setBugReportOpen] = useState(false);

  const rows: SettingsRow[] = [
    {
      id: "dark-mode",
      label: t("settings.darkMode.label"),
      description: t("settings.darkMode.description"),
      checked: isDarkMode,
      onCheckedChange: toggleDarkMode,
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
    {
      id: "show-status-bar",
      label: t("settings.statusBar.label"),
      description: t("settings.statusBar.description"),
      checked: showStatusBar,
      onCheckedChange: toggleShowStatusBar,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-sm" data-testid="settingsDialog">
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
          {isAuthenticated && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setBugReportOpen(true)}
              data-testid="reportBugButton"
            >
              <Bug size={16} />
              {t("bugReport.reportBug")}
            </Button>
          )}
        </div>
      </DialogContent>
      <BugReportDialog open={bugReportOpen} onOpenChange={setBugReportOpen} />
    </Dialog>
  );
}
