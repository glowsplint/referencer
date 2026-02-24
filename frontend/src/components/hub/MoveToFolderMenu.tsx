import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FolderInput } from "lucide-react";
import { buildFolderTree, type FolderNode } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";

interface MoveToFolderMenuProps {
  folders: FolderItem[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
}

function FolderOption({
  node,
  currentFolderId,
  onMove,
  indent,
}: {
  node: FolderNode;
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
  indent: number;
}) {
  const isActive = node.folder.id === currentFolderId;
  return (
    <>
      <DropdownMenu.Item
        onSelect={() => onMove(node.folder.id)}
        disabled={isActive}
        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
        style={{ paddingLeft: `${12 + indent * 16}px` }}
      >
        {node.folder.name}
      </DropdownMenu.Item>
      {node.children.map((child) => (
        <FolderOption
          key={child.folder.id}
          node={child}
          currentFolderId={currentFolderId}
          onMove={onMove}
          indent={indent + 1}
        />
      ))}
    </>
  );
}

export function MoveToFolderMenu({ folders, currentFolderId, onMove }: MoveToFolderMenuProps) {
  const tree = buildFolderTree(folders);

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors data-[state=open]:bg-accent">
        <FolderInput size={14} /> Move to...
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          sideOffset={4}
          className="z-50 min-w-[180px] max-h-[300px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
        >
          <DropdownMenu.Item
            onSelect={() => onMove(null)}
            disabled={!currentFolderId}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
          >
            No folder
          </DropdownMenu.Item>
          {tree.length > 0 && <DropdownMenu.Separator className="my-1 h-px bg-border" />}
          {tree.map((node) => (
            <FolderOption
              key={node.folder.id}
              node={node}
              currentFolderId={currentFolderId}
              onMove={onMove}
              indent={0}
            />
          ))}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}
