// Informational dialog shown on mobile devices, advising that the app is
// designed for desktop. Users can dismiss it and continue in read-only mode.
import { useTranslation } from "react-i18next";
import { Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MobileInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileInfoDialog({ open, onOpenChange }: MobileInfoDialogProps) {
  const { t } = useTranslation("dialogs");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 p-0 sm:max-w-sm"
        data-testid="mobileInfoDialog"
      >
        <DialogHeader className="p-6 pb-4 items-center text-center">
          <Monitor className="size-10 text-muted-foreground mb-2" />
          <DialogTitle>{t("mobile.title")}</DialogTitle>
          <DialogDescription>{t("mobile.description")}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
