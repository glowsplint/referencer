// Document settings dialog with theme preview cards and toggle switches for
// arrow visibility, status bar, and overscroll.
import { useTranslation } from "react-i18next";
import i18n, { LANGUAGE_OPTIONS } from "@/i18n";
import type { Theme } from "@/types/editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const THEME_OPTIONS: {
  value: Theme;
  bg: string;
  text: string;
  split?: boolean;
  bgRight?: string;
  textRight?: string;
}[] = [
  {
    value: "auto",
    bg: "#ffffff",
    text: "#1a1a2e",
    split: true,
    bgRight: "#1e1e2e",
    textRight: "#e4e4e7",
  },
  { value: "light", bg: "#ffffff", text: "#1a1a2e" },
  { value: "dark", bg: "#1e1e2e", text: "#e4e4e7" },
  { value: "sepia", bg: "#f5f0e8", text: "#3d3229" },
  { value: "high-contrast", bg: "#000000", text: "#ffffff" },
];

interface ThemeCardProps {
  option: (typeof THEME_OPTIONS)[number];
  selected: boolean;
  label: string;
  onSelect: () => void;
}

function ThemeCard({ option, selected, label, onSelect }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`theme-card-${option.value}`}
      className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
        selected ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
      }`}
    >
      <div
        className="flex w-14 h-10 rounded-md border border-border overflow-hidden"
        style={option.split ? undefined : { backgroundColor: option.bg, color: option.text }}
      >
        {option.split ? (
          <>
            <div
              className="flex-1 flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: option.bg, color: option.text }}
            >
              Aa
            </div>
            <div
              className="flex-1 flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: option.bgRight,
                color: option.textRight,
              }}
            >
              Aa
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs font-bold">Aa</div>
        )}
      </div>
      <span className="text-[10px] leading-tight text-center text-muted-foreground">{label}</span>
    </button>
  );
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  hideOffscreenArrows: boolean;
  toggleHideOffscreenArrows: () => void;
  showStatusBar: boolean;
  toggleShowStatusBar: () => void;
  overscroll: boolean;
  toggleOverscroll: () => void;
  reduceMotion: "auto" | "on" | "off";
  setReduceMotion: (value: "auto" | "on" | "off") => void;
  hideAnnotations: boolean;
  toggleHideAnnotations: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  setTheme,
  hideOffscreenArrows,
  toggleHideOffscreenArrows,
  showStatusBar,
  toggleShowStatusBar,
  overscroll,
  toggleOverscroll,
  reduceMotion,
  setReduceMotion,
  hideAnnotations,
  toggleHideAnnotations,
}: SettingsDialogProps) {
  const { t } = useTranslation("dialogs");

  const rows: SettingsRow[] = [
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
    {
      id: "overscroll",
      label: t("settings.overscroll.label"),
      description: t("settings.overscroll.description"),
      checked: overscroll,
      onCheckedChange: toggleOverscroll,
    },
    {
      id: "hide-annotations",
      label: t("settings.hideAnnotations.label"),
      description: t("settings.hideAnnotations.description"),
      checked: hideAnnotations,
      onCheckedChange: toggleHideAnnotations,
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
          {/* Theme selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("settings.theme.label")}</label>
            <p className="text-xs text-muted-foreground">{t("settings.theme.description")}</p>
            <div className="flex gap-1 justify-between" data-testid="theme-selector">
              {THEME_OPTIONS.map((option) => (
                <ThemeCard
                  key={option.value}
                  option={option}
                  selected={theme === option.value}
                  label={t(`settings.theme.${option.value}`)}
                  onSelect={() => setTheme(option.value)}
                />
              ))}
            </div>
          </div>
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
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="reduce-motion" className="text-sm font-medium cursor-pointer">
                {t("settings.reduceMotion.label")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("settings.reduceMotion.description")}
              </p>
            </div>
            <select
              id="reduce-motion"
              value={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.value as "auto" | "on" | "off")}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              data-testid="reduce-motion-select"
            >
              <option value="auto">{t("settings.reduceMotion.auto")}</option>
              <option value="on">{t("settings.reduceMotion.on")}</option>
              <option value="off">{t("settings.reduceMotion.off")}</option>
            </select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
