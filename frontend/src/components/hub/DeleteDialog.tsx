import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceTitle: string;
  onDelete: () => void;
}

export function DeleteDialog({ open, onOpenChange, workspaceTitle, onDelete }: DeleteDialogProps) {
  const { t } = useTranslation("management");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="deleteDialog">
        <DialogHeader>
          <DialogTitle>{t("hub.deleteWorkspaceTitle")}</DialogTitle>
          <DialogDescription>
            {t("hub.deleteWorkspaceConfirm", { title: workspaceTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("hub.cancel")}
          </Button>
          <Button variant="destructive" onClick={onDelete} data-testid="confirmDelete">
            {t("hub.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
