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
  onDelete: () => Promise<void>;
}

export function DeleteFolderDialog({ open, onOpenChange, folderName, onDelete }: DeleteFolderDialogProps) {
  const handleDelete = async () => {
    await onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="deleteFolderDialog">
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{folderName}&rdquo;? All subfolders will also be
            deleted. Workspaces inside will be moved out of the folder. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} data-testid="confirmDeleteFolder">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
