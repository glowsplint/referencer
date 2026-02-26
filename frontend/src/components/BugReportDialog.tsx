import { useCallback, useEffect, useRef, useState } from "react";
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

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const { t } = useTranslation("dialogs");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on image change or unmount
  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const validateAndSetImage = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(t("bugReport.invalidImageType"));
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(t("bugReport.imageTooLarge"));
        return;
      }
      setImage(file);
    },
    [t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetImage(file);
    },
    [validateAndSetImage],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            validateAndSetImage(file);
            break;
          }
        }
      }
    },
    [validateAndSetImage],
  );

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const viewport = `${window.innerWidth}x${window.innerHeight}`;
      const appVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown";

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("viewport", viewport);
      formData.append("appVersion", appVersion);
      if (image) {
        formData.append("image", image);
      }

      const resp = await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        body: formData,
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
      setImage(null);
      onOpenChange(false);
    } catch {
      toast.error(t("bugReport.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="bugReportDialog" onPaste={handlePaste}>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("bugReport.screenshotLabel")}</label>
            <div
              data-testid="bugReportDropZone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-input p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50"
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Screenshot preview"
                    className="max-h-32 rounded"
                    data-testid="bugReportImagePreview"
                  />
                  <button
                    type="button"
                    data-testid="bugReportImageRemove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                    }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                  >
                    X
                  </button>
                </div>
              ) : (
                <span>{t("bugReport.attachScreenshot")}</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) validateAndSetImage(file);
                  e.target.value = "";
                }}
              />
            </div>
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
