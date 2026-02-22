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
  onDelete: () => Promise<void>;
}

export function DeleteDialog({
  open,
  onOpenChange,
  workspaceTitle,
  onDelete,
}: DeleteDialogProps) {
  const handleDelete = async () => {
    await onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm"
        data-testid="deleteDialog"
      >
        <DialogHeader>
          <DialogTitle>Delete Workspace</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{workspaceTitle}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            data-testid="confirmDelete"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
