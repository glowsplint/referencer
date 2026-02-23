// Dialog for sharing the workspace via URL. Generates either a read-only or
// edit link using hash-based routing (e.g., #/<workspaceId>?access=readonly)
// and copies it to the clipboard.
import { useTranslation } from "react-i18next";
import { Link, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

const BASE_URL = import.meta.env.BASE_URL;

export function ShareDialog({ open, onOpenChange, workspaceId }: ShareDialogProps) {
  const { t } = useTranslation("dialogs");

  async function copyLink(access: "edit" | "readonly") {
    const hash = access === "readonly" ? `#/${workspaceId}?access=readonly` : `#/${workspaceId}`;
    const url = `${window.location.origin}${BASE_URL}${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("share.linkCopied"));
      onOpenChange(false);
    } catch {
      toast.error(t("share.copyFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="shareDialog">
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>{t("share.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => copyLink("readonly")}
            data-testid="shareReadonlyButton"
          >
            <Eye />
            {t("share.readonlyLink")}
          </Button>
          <Button variant="outline" onClick={() => copyLink("edit")} data-testid="shareEditButton">
            <Link />
            {t("share.editLink")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
