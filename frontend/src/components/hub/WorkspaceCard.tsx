import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, ExternalLink, Pencil, Copy, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/annotation/format-relative-time";
import type { WorkspaceItem } from "@/lib/workspace-client";

interface WorkspaceCardProps {
  workspace: WorkspaceItem;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function WorkspaceCard({
  workspace,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: WorkspaceCardProps) {
  return (
    <div
      className="group relative flex flex-col p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
      onClick={onOpen}
      data-testid={`workspaceCard-${workspace.workspaceId}`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-sm truncate pr-2">{workspace.title || "Untitled"}</h3>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0"
              data-testid="workspaceCardMenu"
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={4}
              className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-md"
            >
              <DropdownMenu.Item
                onSelect={onOpen}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ExternalLink size={14} /> Open
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onRename}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Pencil size={14} /> Rename
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onDuplicate}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Copy size={14} /> Duplicate
              </DropdownMenu.Item>
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
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {formatRelativeTime(workspace.updatedAt)}
      </p>
    </div>
  );
}
