import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NewWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
}

export function NewWorkspaceDialog({ open, onOpenChange, onCreate }: NewWorkspaceDialogProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset title when dialog opens
  const prevOpenRef = useRef(open);
  if (open && !prevOpenRef.current) {
    setTitle("");
  }
  prevOpenRef.current = open;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(title.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        data-testid="newWorkspaceDialog"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
          <DialogDescription>Enter a name for your workspace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Workspace name"
            data-testid="newWorkspaceNameInput"
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} data-testid="newWorkspaceCreateButton">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
