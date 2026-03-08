"use client";

import { type Editor } from "@tiptap/core";
import { useTranslation } from "react-i18next";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Superscript,
  Subscript,
  Link,
  Eraser,
  HelpCircle,
} from "lucide-react";

import { useTiptapEditor } from "@/hooks/ui/use-tiptap-editor";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/tiptap-ui-primitive/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTextRemoval } from "./use-text-removal";

const MARK_TYPES = [
  { name: "bold", label: "Bold", icon: <Bold size={14} /> },
  { name: "italic", label: "Italic", icon: <Italic size={14} /> },
  { name: "underline", label: "Underline", icon: <Underline size={14} /> },
  { name: "strike", label: "Strikethrough", icon: <Strikethrough size={14} /> },
  { name: "code", label: "Code", icon: <Code size={14} /> },
  { name: "superscript", label: "Superscript", icon: <Superscript size={14} /> },
  { name: "subscript", label: "Subscript", icon: <Subscript size={14} /> },
  { name: "link", label: "Link", icon: <Link size={14} /> },
];

export function TextRemovalButton() {
  const { editor } = useTiptapEditor();
  const removal = useTextRemoval(editor);
  const { t } = useTranslation("editor");

  if (!editor) return null;

  return (
    <>
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label={t("textRemoval.label")}
        tooltip={t("textRemoval.label")}
        disabled={!editor.isEditable}
        onClick={removal.openDialog}
      >
        <Eraser className="tiptap-button-icon" />
      </Button>
      <TextRemovalDialog editor={editor} removal={removal} />
    </>
  );
}

export function TextRemovalDialog({
  editor: _editor,
  removal,
}: {
  editor: Editor;
  removal: ReturnType<typeof useTextRemoval>;
}) {
  void _editor; // kept for API symmetry with other dialog components
  const { t } = useTranslation("editor");

  return (
    <>
      {removal.isMinimized && removal.isOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-background border shadow-lg px-4 py-2"
          data-testid="textRemovalPill"
        >
          <span className="text-sm text-muted-foreground">
            {t("textRemoval.matchCount", { count: removal.matchCount })}
          </span>
          <ShadcnButton size="sm" variant="outline" onClick={removal.toggleMinimize}>
            {t("textRemoval.restore")}
          </ShadcnButton>
        </div>
      )}

      <Dialog
        open={removal.isOpen && !removal.isMinimized}
        onOpenChange={(open) => {
          if (!open) removal.closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md" data-testid="textRemovalDialog">
          <DialogHeader>
            <DialogTitle>{t("textRemoval.title")}</DialogTitle>
            <DialogDescription>{t("textRemoval.description")}</DialogDescription>
          </DialogHeader>

          {/* Mark toggle buttons */}
          <div>
            <label className="text-sm font-medium">{t("textRemoval.marks")}</label>
            <div className="flex flex-wrap gap-1 mt-2">
              {MARK_TYPES.map((mark) => (
                <button
                  key={mark.name}
                  onClick={() => removal.toggleMark(mark.name)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors",
                    removal.selectedMarks.includes(mark.name)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent",
                  )}
                  data-testid={`markToggle-${mark.name}`}
                >
                  {mark.icon}
                  {t(`mark.${mark.name}`, mark.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern input */}
          <div>
            <label className="text-sm font-medium inline-flex items-center gap-1">
              {t("textRemoval.pattern")}
              <Tooltip placement="top" delay={300}>
                <TooltipTrigger asChild>
                  <span>
                    <HelpCircle size={14} className="text-muted-foreground cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("textRemoval.patternHelp")}</TooltipContent>
              </Tooltip>
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={removal.pattern}
                onChange={(e) => removal.setPattern(e.target.value)}
                placeholder={t("textRemoval.patternPlaceholder")}
                className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
                data-testid="patternInput"
              />
              <ShadcnButton
                size="sm"
                variant={removal.isRegex ? "default" : "outline"}
                onClick={removal.toggleRegex}
                data-testid="regexToggle"
              >
                {removal.isRegex ? t("textRemoval.regexMode") : t("textRemoval.globMode")}
              </ShadcnButton>
            </div>
            {removal.patternError && (
              <p className="text-xs text-destructive mt-1">{t("textRemoval.invalidPattern")}</p>
            )}
          </div>

          {/* Match count */}
          <div className="text-sm text-muted-foreground" data-testid="matchCount">
            {removal.matchCount > 0
              ? t("textRemoval.matchCount", { count: removal.matchCount })
              : t("textRemoval.noMatches")}
          </div>

          {/* Confirmation sub-section (inline, not a separate dialog) */}
          {removal.showConfirmation ? (
            <DialogFooter>
              <p className="text-sm mr-auto">
                {t("textRemoval.confirmMessage", { count: removal.matchCount })}
              </p>
              <ShadcnButton variant="outline" onClick={removal.cancelRemoval}>
                {t("textRemoval.cancel")}
              </ShadcnButton>
              <ShadcnButton
                variant="destructive"
                onClick={removal.confirmRemoval}
                data-testid="confirmRemove"
              >
                {t("textRemoval.confirmRemove")}
              </ShadcnButton>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <ShadcnButton variant="outline" onClick={removal.toggleMinimize}>
                {t("textRemoval.minimize")}
              </ShadcnButton>
              <ShadcnButton variant="outline" onClick={removal.closeDialog}>
                {t("textRemoval.cancel")}
              </ShadcnButton>
              <ShadcnButton
                variant="destructive"
                disabled={removal.matchCount === 0}
                onClick={removal.requestRemoval}
                data-testid="removeButton"
              >
                {t("textRemoval.remove")}
              </ShadcnButton>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
