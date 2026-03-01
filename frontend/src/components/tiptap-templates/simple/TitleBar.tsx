// Title bar with inline-editable document title, share dialog trigger,
// workspace switcher dropdown, and PDF export button. Sits above the editor toolbar.
import { useCallback, useEffect, useRef, useState } from "react";
import { Share2, Download, Home, ChevronDown, Check } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/tiptap-ui-primitive/tooltip";
import { ShareDialog } from "@/components/ShareDialog";
import { CollaborationPresence } from "@/components/CollaborationPresence";
import { LoginButton } from "@/components/LoginButton";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/data/use-auth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWorkspaces } from "@/hooks/data/use-workspaces";
import { renameWorkspace, fetchWorkspace } from "@/lib/workspace-client";

interface TitleBarProps {
  navigate?: (hash: string) => void;
}

export function TitleBar({ navigate }: TitleBarProps) {
  const { workspaceId, readOnly, yjs } = useWorkspace();
  const { isAuthenticated, isLoading } = useAuth();
  const { workspaces } = useWorkspaces();
  const [title, setTitle] = useState("Title");
  const [isEditing, setIsEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dbSeededRef = useRef(false);
  const pendingRenameRef = useRef<Promise<void>>(Promise.resolve());

  // Sync title with Yjs shared map for real-time collaboration
  useEffect(() => {
    if (!yjs.doc) return;
    const meta = yjs.doc.getMap("workspace-meta");
    const existing = meta.get("title");
    if (typeof existing === "string" && existing) {
      setTitle(existing);
    }
    const observer = () => {
      const t = meta.get("title");
      if (typeof t === "string" && t) setTitle(t);
    };
    meta.observe(observer);
    return () => meta.unobserve(observer);
  }, [yjs.doc]);

  // Fetch DB title and seed Yjs once on first sync (handles hub renames)
  useEffect(() => {
    if (!isAuthenticated || !workspaceId || !yjs.doc || !yjs.synced) return;
    if (dbSeededRef.current) return;
    dbSeededRef.current = true;
    fetchWorkspace(workspaceId).then((ws) => {
      if (!ws?.title) return;
      const meta = yjs.doc!.getMap("workspace-meta");
      const yjsTitle = meta.get("title");
      // DB is source of truth on initial load — update Yjs if they differ
      if (yjsTitle !== ws.title) {
        meta.set("title", ws.title);
        setTitle(ws.title);
      }
    });
  }, [isAuthenticated, workspaceId, yjs.doc, yjs.synced]);

  const startEditing = useCallback(() => {
    if (readOnly) return;
    setIsEditing(true);
  }, [readOnly]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    const finalTitle = title.trim() || "Title";
    if (title.trim() === "") {
      setTitle("Title");
    }

    // Persist to Yjs map for real-time sync
    const meta = yjs.doc?.getMap("workspace-meta");
    meta?.set("title", finalTitle);

    // Persist to database for authenticated users
    if (isAuthenticated && workspaceId) {
      pendingRenameRef.current = renameWorkspace(workspaceId, finalTitle).catch(() => {});
    }
  }, [title, yjs.doc, isAuthenticated, workspaceId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const showSwitcher = isAuthenticated && navigate && workspaces.length > 0;

  return (
    <div className="flex shrink-0 items-center border-b border-[var(--tt-border-color-tint)] bg-[var(--tt-bg-color)] px-4 py-2">
      {navigate && !showSwitcher && (
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <button
              onClick={async () => {
                await pendingRenameRef.current;
                navigate("#/");
              }}
              className="mr-2 rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              data-testid="homeButton"
            >
              <Home size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Home</TooltipContent>
        </Tooltip>
      )}
      {showSwitcher && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="mr-2 flex items-center rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              data-testid="workspaceSwitcher"
            >
              <Home size={16} />
              <ChevronDown size={12} className="ml-0.5 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={4}
              className="z-50 max-h-[300px] min-w-[200px] max-w-[300px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
              data-testid="workspaceSwitcherMenu"
            >
              <DropdownMenu.Item
                onSelect={async () => {
                  await pendingRenameRef.current;
                  navigate("#/");
                }}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                data-testid="workspaceSwitcherHub"
              >
                <Home size={14} />
                Hub
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {workspaces.map((ws) => {
                const isCurrent = ws.workspaceId === workspaceId;
                return (
                  <DropdownMenu.Item
                    key={ws.workspaceId}
                    onSelect={async () => {
                      if (isCurrent) return;
                      await pendingRenameRef.current;
                      navigate(`#/${ws.workspaceId}`);
                    }}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${isCurrent ? "bg-accent/50" : ""}`}
                    data-testid={`workspaceSwitcherItem-${ws.workspaceId}`}
                  >
                    <span className="flex-1 truncate">{ws.title || "Untitled"}</span>
                    {isCurrent && <Check size={14} className="shrink-0 text-primary" />}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
      {isEditing ? (
        <input
          ref={inputRef}
          className="min-w-[100px] rounded-md border border-[var(--tt-brand-color-400)] bg-transparent px-2 py-1 font-[inherit] text-sm font-medium text-[var(--tt-theme-text)] outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      ) : (
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <div
              className="cursor-text select-none rounded-md border border-transparent px-2 py-1 text-sm font-medium text-[var(--tt-theme-text)] transition-[border-color] duration-150 hover:border-[var(--tt-border-color)]"
              onClick={startEditing}
            >
              {title}
            </div>
          </TooltipTrigger>
          <TooltipContent>Rename</TooltipContent>
        </Tooltip>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                yjs.connected
                  ? "animate-[pulse_3s_ease-in-out_infinite] bg-green-500"
                  : "bg-gray-400"
              }`}
              data-testid="connectionStatusDot"
            />
          </TooltipTrigger>
          <TooltipContent>{yjs.connected ? "Connected" : "Offline"}</TooltipContent>
        </Tooltip>
        <CollaborationPresence provider={yjs.provider?.wsProvider ?? null} className="mr-1" />
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.print()}
              className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              data-testid="exportPdfButton"
            >
              <Download size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Export as PDF</TooltipContent>
        </Tooltip>
        <Tooltip placement="bottom" delay={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-md p-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
              data-testid="shareButton"
            >
              <Share2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
        {!isLoading && (isAuthenticated ? <UserMenu /> : <LoginButton />)}
      </div>
      {workspaceId && (
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} workspaceId={workspaceId} />
      )}
    </div>
  );
}
