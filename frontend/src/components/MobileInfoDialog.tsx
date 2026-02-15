import { Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MobileInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileInfoDialog({ open, onOpenChange }: MobileInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 sm:max-w-sm"
        data-testid="mobileInfoDialog"
      >
        <DialogHeader className="p-6 pb-4 items-center text-center">
          <Monitor className="size-10 text-muted-foreground mb-2" />
          <DialogTitle>Best on Desktop</DialogTitle>
          <DialogDescription>
            Referencer is designed for desktop use with a keyboard and mouse.
            You can still read the content here, but editing and annotation
            tools are not available on mobile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t bg-background p-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="w-full"
              data-testid="mobileInfoDismissButton"
            >
              Continue Reading
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
