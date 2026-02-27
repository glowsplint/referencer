// Dialog for sharing the workspace via URL. Creates a share link through the
// backend API and copies the resulting URL to the clipboard.
// Unauthenticated users see a login prompt instead of share options.
import { useTranslation } from "react-i18next";
import { Link, Eye, LogIn } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";
import { useAuth } from "@/hooks/data/use-auth";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function ShareDialog({ open, onOpenChange, workspaceId }: ShareDialogProps) {
  const { t } = useTranslation("dialogs");
  const { isAuthenticated, login } = useAuth();

  async function handleShare(access: "edit" | "readonly") {
    try {
      const data = await apiPost<{ url: string }>("/api/share", { workspaceId, access });
      const url = `${window.location.origin}${data.url}`;
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
          <DialogDescription>
            {isAuthenticated ? t("share.description") : t("share.loginRequired")}
          </DialogDescription>
        </DialogHeader>
        {isAuthenticated ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => handleShare("readonly")}
              data-testid="shareReadonlyButton"
            >
              <Eye />
              {t("share.readonlyLink")}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("edit")}
              data-testid="shareEditButton"
            >
              <Link />
              {t("share.editLink")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-testid="shareLoginPrompt">
            <Button variant="outline" onClick={() => login("google")}>
              <LogIn className="size-4" />
              {t("share.loginGoogle")}
            </Button>
            <Button variant="outline" onClick={() => login("github")}>
              <LogIn className="size-4" />
              {t("share.loginGithub")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
