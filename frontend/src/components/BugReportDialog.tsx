import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const { t } = useTranslation("dialogs");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const resp = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      if (resp.status === 429) {
        toast.error(t("bugReport.rateLimited"));
        return;
      }

      if (!resp.ok) {
        toast.error(t("bugReport.error"));
        return;
      }

      toast.success(t("bugReport.success"));
      setTitle("");
      setDescription("");
      onOpenChange(false);
    } catch {
      toast.error(t("bugReport.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="bugReportDialog">
        <DialogHeader>
          <DialogTitle>{t("bugReport.title")}</DialogTitle>
          <DialogDescription>{t("bugReport.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="bug-title" className="text-sm font-medium">
              {t("bugReport.titleLabel")}
            </label>
            <input
              id="bug-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("bugReport.titlePlaceholder")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              data-testid="bugReportTitle"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="bug-description" className="text-sm font-medium">
              {t("bugReport.descriptionLabel")}
            </label>
            <textarea
              id="bug-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("bugReport.descriptionPlaceholder")}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              data-testid="bugReportDescription"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="w-full"
            data-testid="bugReportSubmit"
          >
            {submitting ? t("bugReport.submitting") : t("bugReport.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
