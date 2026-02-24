import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Pencil, FolderPlus, Trash2 } from "lucide-react";

interface FolderDropdownMenuProps {
  depth: number;
  onRename: () => void;
  onNewSubfolder: () => void;
  onDelete: () => void;
}

export function FolderDropdownMenu({ depth, onRename, onNewSubfolder, onDelete }: FolderDropdownMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-md opacity-0 group-hover/folder:opacity-100 hover:bg-accent transition-all shrink-0"
          data-testid="folderMenu"
        >
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu.Item
            onSelect={onRename}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Pencil size={14} /> Rename
          </DropdownMenu.Item>
          {depth < 3 && (
            <DropdownMenu.Item
              onSelect={onNewSubfolder}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FolderPlus size={14} /> New Subfolder
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
