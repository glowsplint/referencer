// Dialog for sharing the workspace via URL. Creates share links, manages
// active links and workspace members with role management.
// Unauthenticated users see a login prompt instead of share options.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Eye, LogIn, Copy, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/data/use-auth";
import { apiPost } from "@/lib/api-client";
import { useShareManagement, type WorkspaceMember } from "@/hooks/data/use-share-management";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

function RoleBadge({ role, t }: { role: string; t: (key: string) => string }) {
  const colors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    editor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  const labels: Record<string, string> = {
    owner: t("share.roleOwner"),
    editor: t("share.roleEditor"),
    viewer: t("share.roleViewer"),
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? colors.viewer}`}
    >
      {labels[role] ?? role}
    </span>
  );
}

function AccessBadge({ access, t }: { access: string; t: (key: string) => string }) {
  const isEdit = access === "edit";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isEdit
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {isEdit ? t("share.edit") : t("share.readonly")}
    </span>
  );
}

function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
      {initials}
    </div>
  );
}

function RoleSelect({
  member,
  onChangeRole,
}: {
  member: WorkspaceMember;
  onChangeRole: (role: "editor" | "viewer") => void;
}) {
  return (
    <select
      value={member.role}
      onChange={(e) => onChangeRole(e.target.value as "editor" | "viewer")}
      className="bg-background border-input rounded-md border px-2 py-1 text-xs"
    >
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>
  );
}

export function ShareDialog({ open, onOpenChange, workspaceId }: ShareDialogProps) {
  const { t } = useTranslation("dialogs");
  const { user, isAuthenticated, login } = useAuth();
  const { links, members, isLoading, refetch, revokeLink, changeMemberRole, removeMember } =
    useShareManagement(workspaceId, open && isAuthenticated);
  const [creatingLink, setCreatingLink] = useState(false);

  const isOwner = members.some((m) => m.userId === user?.id && m.role === "owner");

  async function handleShare(access: "edit" | "readonly") {
    setCreatingLink(true);
    try {
      const data = await apiPost<{ url: string }>("/api/share", {
        workspaceId,
        access,
      });
      const url = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("share.linkCopied"));
      refetch();
    } catch {
      toast.error(t("share.copyFailed"));
    } finally {
      setCreatingLink(false);
    }
  }

  async function handleCopyLink(code: string) {
    try {
      const url = `${window.location.origin}/s/${code}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("share.linkCopied"));
    } catch {
      toast.error(t("share.copyFailed"));
    }
  }

  async function handleRevoke(code: string) {
    try {
      await revokeLink(code);
      toast.success(t("share.linkRevoked"));
    } catch {
      toast.error(t("share.revokeFailed"));
    }
  }

  async function handleRoleChange(userId: string, role: "editor" | "viewer") {
    try {
      await changeMemberRole(userId, role);
      toast.success(t("share.roleChanged"));
    } catch {
      toast.error(t("share.roleChangeFailed"));
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMember(userId);
      toast.success(t("share.memberRemoved"));
    } catch {
      toast.error(t("share.removeFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="shareDialog">
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>
            {isAuthenticated ? t("share.description") : t("share.loginRequired")}
          </DialogDescription>
        </DialogHeader>

        {isAuthenticated ? (
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
            {/* Create link buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => handleShare("readonly")}
                disabled={creatingLink}
                data-testid="shareReadonlyButton"
              >
                {creatingLink ? <Loader2 className="animate-spin" /> : <Eye />}
                {t("share.readonlyLink")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("edit")}
                disabled={creatingLink}
                data-testid="shareEditButton"
              >
                {creatingLink ? <Loader2 className="animate-spin" /> : <Link />}
                {t("share.editLink")}
              </Button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
                <Loader2 className="size-4 animate-spin" />
                {t("share.loading")}
              </div>
            )}

            {/* Active links section */}
            {links.length > 0 && (
              <div data-testid="shareLinksList">
                <h4 className="text-sm font-medium mb-2">{t("share.activeLinks")}</h4>
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <div
                      key={link.code}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <AccessBadge access={link.access} t={t} />
                      <span className="text-muted-foreground flex-1 truncate font-mono text-xs">
                        {link.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(link.code)}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title={t("share.copyLink")}
                        data-testid="copyLinkButton"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(link.code)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        title={t("share.revoke")}
                        data-testid="revokeLinkButton"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members section */}
            {members.length > 0 && (
              <div data-testid="shareMembersList">
                <h4 className="text-sm font-medium mb-2">{t("share.members")}</h4>
                <div className="flex flex-col gap-2">
                  {members.map((member) => {
                    const isCurrentUser = member.userId === user?.id;
                    const isMemberOwner = member.role === "owner";

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                      >
                        <MemberAvatar name={member.name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <span className="truncate">{member.name}</span>
                            {isCurrentUser && (
                              <span className="text-muted-foreground text-xs">
                                ({t("share.you")})
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {member.email}
                          </div>
                        </div>

                        {isOwner && !isMemberOwner && !isCurrentUser ? (
                          <div className="flex items-center gap-1">
                            <RoleSelect
                              member={member}
                              onChangeRole={(role) => handleRoleChange(member.userId, role)}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              data-testid="removeMemberButton"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <RoleBadge role={member.role} t={t} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-testid="shareLoginPrompt">
            <Button variant="outline" onClick={() => login("google")}>
              <LogIn className="size-4" />
              {t("share.loginGoogle")}
            </Button>
            <Button variant="outline" onClick={() => login("github")}>
              <LogIn className="size-4" />
              {t("share.loginGithub")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
