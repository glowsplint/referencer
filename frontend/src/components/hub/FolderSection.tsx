import { Folder, ChevronRight, ChevronDown } from "lucide-react";
import { useFolderCollapse } from "@/hooks/ui/use-folder-collapse";
import { getWorkspacesForFolder } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";
import { InlineNameInput } from "./InlineNameInput";
import { FolderDropdownMenu } from "./FolderDropdownMenu";
import { WorkspaceCard } from "./WorkspaceCard";
import { WorkspaceListItem } from "./WorkspaceListItem";

interface FolderSectionProps {
  node: FolderNode;
  workspaces: WorkspaceItem[];
  folders: FolderItem[];
  viewMode: "grid" | "list";
  renamingFolderId: string | null;
  creatingSubfolderId: string | null;
  onSetRenamingFolder: (id: string | null) => void;
  onSetCreatingSubfolder: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDeleteFolder: (folder: FolderItem) => void;
  onCreateFolder: (parentId: string | null, name: string) => Promise<void>;
  onOpenWorkspace: (id: string) => void;
  onRenameWorkspace: (ws: WorkspaceItem) => void;
  onDuplicateWorkspace: (sourceId: string) => void;
  onDeleteWorkspace: (ws: WorkspaceItem) => void;
  onToggleFavorite: (workspaceId: string, isFavorite: boolean) => Promise<void>;
  onMoveToFolder: (workspaceId: string, folderId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function FolderSection({
  node,
  workspaces,
  folders,
  viewMode,
  renamingFolderId,
  creatingSubfolderId,
  onSetRenamingFolder,
  onSetCreatingSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onOpenWorkspace,
  onRenameWorkspace,
  onDuplicateWorkspace,
  onDeleteWorkspace,
  onToggleFavorite,
  onMoveToFolder,
  ownerName,
  ownerAvatarUrl,
}: FolderSectionProps) {
  const { isCollapsed, toggleCollapsed } = useFolderCollapse(node.folder.id);
  const folderWorkspaces = getWorkspacesForFolder(workspaces, node.folder.id);
  const isRenaming = renamingFolderId === node.folder.id;
  const isCreatingSubfolder = creatingSubfolderId === node.folder.id;

  return (
    <div className={node.depth > 0 ? "pl-6" : ""} data-testid={`folderSection-${node.folder.id}`}>
      {/* Folder header */}
      <div
        className="group/folder flex items-center gap-1.5 py-2 px-1 rounded-md hover:bg-accent/30 cursor-pointer transition-colors"
        onClick={toggleCollapsed}
      >
        <button className="p-0.5 shrink-0">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <Folder size={14} className="text-muted-foreground shrink-0" />
        {isRenaming ? (
          <InlineNameInput
            defaultValue={node.folder.name}
            onSave={(name) => {
              onRenameFolder(node.folder.id, name);
              onSetRenamingFolder(null);
            }}
            onCancel={() => onSetRenamingFolder(null)}
          />
        ) : (
          <span className="text-sm font-medium truncate">{node.folder.name}</span>
        )}
        <span className="text-xs text-muted-foreground ml-1 shrink-0">
          {folderWorkspaces.length}
        </span>
        <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
          <FolderDropdownMenu
            depth={node.depth}
            onRename={() => onSetRenamingFolder(node.folder.id)}
            onNewSubfolder={() => onSetCreatingSubfolder(node.folder.id)}
            onDelete={() => onDeleteFolder(node.folder)}
          />
        </div>
      </div>

      {/* Folder contents */}
      {!isCollapsed && (
        <div className="ml-2">
          {/* Inline input for new subfolder */}
          {isCreatingSubfolder && (
            <div className="pl-6 py-1 flex items-center gap-1.5">
              <Folder size={14} className="text-muted-foreground shrink-0" />
              <InlineNameInput
                onSave={(name) => {
                  onCreateFolder(node.folder.id, name);
                  onSetCreatingSubfolder(null);
                }}
                onCancel={() => onSetCreatingSubfolder(null)}
              />
            </div>
          )}

          {/* Child folders */}
          {node.children.map((child) => (
            <FolderSection
              key={child.folder.id}
              node={child}
              workspaces={workspaces}
              folders={folders}
              viewMode={viewMode}
              renamingFolderId={renamingFolderId}
              creatingSubfolderId={creatingSubfolderId}
              onSetRenamingFolder={onSetRenamingFolder}
              onSetCreatingSubfolder={onSetCreatingSubfolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={onCreateFolder}
              onOpenWorkspace={onOpenWorkspace}
              onRenameWorkspace={onRenameWorkspace}
              onDuplicateWorkspace={onDuplicateWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
              onToggleFavorite={onToggleFavorite}
              onMoveToFolder={onMoveToFolder}
              ownerName={ownerName}
              ownerAvatarUrl={ownerAvatarUrl}
            />
          ))}

          {/* Workspaces inside this folder */}
          {folderWorkspaces.length > 0 &&
            (viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pl-6 py-2">
                {folderWorkspaces.map((ws) => (
                  <WorkspaceCard
                    key={ws.workspaceId}
                    workspace={ws}
                    onOpen={() => onOpenWorkspace(ws.workspaceId)}
                    onRename={() => onRenameWorkspace(ws)}
                    onDuplicate={() => onDuplicateWorkspace(ws.workspaceId)}
                    onDelete={() => onDeleteWorkspace(ws)}
                    onToggleFavorite={onToggleFavorite}
                    folders={folders}
                    onMoveToFolder={onMoveToFolder}
                    ownerName={ownerName}
                    ownerAvatarUrl={ownerAvatarUrl}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 pl-6 py-1">
                {folderWorkspaces.map((ws) => (
                  <WorkspaceListItem
                    key={ws.workspaceId}
                    workspace={ws}
                    onOpen={() => onOpenWorkspace(ws.workspaceId)}
                    onRename={() => onRenameWorkspace(ws)}
                    onDuplicate={() => onDuplicateWorkspace(ws.workspaceId)}
                    onDelete={() => onDeleteWorkspace(ws)}
                    onToggleFavorite={onToggleFavorite}
                    folders={folders}
                    onMoveToFolder={onMoveToFolder}
                    ownerName={ownerName}
                    ownerAvatarUrl={ownerAvatarUrl}
                  />
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
