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

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onDelete: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderName,
  onDelete,
}: DeleteFolderDialogProps) {
  const { t } = useTranslation("management");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="deleteFolderDialog">
        <DialogHeader>
          <DialogTitle>{t("hub.deleteFolderTitle")}</DialogTitle>
          <DialogDescription>
            {t("hub.deleteFolderConfirm", { name: folderName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("hub.cancel")}
          </Button>
          <Button variant="destructive" onClick={onDelete} data-testid="confirmDeleteFolder">
            {t("hub.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
