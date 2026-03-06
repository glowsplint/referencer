// Dialog for sharing the document via URL. Creates share links, manages
// active links and document members with role management.
// Unauthenticated users see a login prompt instead of share options.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link, Eye, LogIn, Copy, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "radix-ui";
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
import { useShareManagement, type DocumentMember } from "@/hooks/data/use-share-management";

type ExpiryOption = "never" | "7" | "30" | "90";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

function RoleBadge({ role, t }: { role: string; t: TFunction<"dialogs"> }) {
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

function AccessBadge({ access, t }: { access: string; t: TFunction<"dialogs"> }) {
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
  member: DocumentMember;
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

function formatExpiryDate(expiresAt: string | null, t: TFunction<"dialogs">): string {
  if (!expiresAt) return t("share.noExpiry");
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return t("share.expired");
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return t("share.expiresIn", { days });
}

function expiryOptionToDate(option: ExpiryOption): string | null {
  if (option === "never") return null;
  const days = parseInt(option);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function ShareDialog({ open, onOpenChange, documentId }: ShareDialogProps) {
  const { t } = useTranslation("dialogs");
  const { user, isAuthenticated, login } = useAuth();
  const { links, members, isLoading, refetch, revokeLink, changeMemberRole, removeMember } =
    useShareManagement(documentId, open && isAuthenticated);
  const [creatingLink, setCreatingLink] = useState(false);
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>("never");
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const isOwner = members.some((m) => m.userId === user?.id && m.role === "owner");

  async function handleShare(access: "edit" | "readonly") {
    setCreatingLink(true);
    try {
      const expiresAt = expiryOptionToDate(expiryOption);
      const data = await apiPost<{ url: string }>("/api/share", {
        documentId,
        access,
        ...(expiresAt && { expiresAt }),
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

  function buildFullUrl(code: string): string {
    return `${window.location.origin}/s/${code}`;
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
            {/* Expiry dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="expirySelect"
                className="whitespace-nowrap text-sm text-muted-foreground"
              >
                {t("share.expiryLabel")}
              </label>
              <select
                id="expirySelect"
                value={expiryOption}
                onChange={(e) => setExpiryOption(e.target.value as ExpiryOption)}
                className="bg-background border-input flex-1 rounded-md border px-2 py-1 text-sm"
                data-testid="expirySelect"
              >
                <option value="never">{t("share.expiryNever")}</option>
                <option value="7">{t("share.expiry7Days")}</option>
                <option value="30">{t("share.expiry30Days")}</option>
                <option value="90">{t("share.expiry90Days")}</option>
              </select>
            </div>

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
                <h4 className="mb-2 text-sm font-medium">{t("share.activeLinks")}</h4>
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <div
                      key={link.code}
                      className="flex flex-col gap-1 rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <AccessBadge access={link.access} t={t} />
                        <span
                          className="text-muted-foreground flex-1 select-all truncate font-mono text-xs"
                          title={buildFullUrl(link.code)}
                          data-testid="shareLinkUrl"
                        >
                          {buildFullUrl(link.code)}
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
                          onClick={() => setRevokeTarget(link.code)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          title={t("share.revoke")}
                          data-testid="revokeLinkButton"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <span className="text-muted-foreground text-xs" data-testid="shareLinkExpiry">
                        {formatExpiryDate(link.expiresAt, t)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members section */}
            {members.length > 0 && (
              <div data-testid="shareMembersList">
                <h4 className="mb-2 text-sm font-medium">{t("share.members")}</h4>
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
                        <div className="min-w-0 flex-1">
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

      {/* Revoke confirmation dialog */}
      <AlertDialog.Root
        open={revokeTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRevokeTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Content
            className="bg-background fixed left-[50%] top-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg sm:max-w-md"
            data-testid="revokeConfirmDialog"
          >
            <AlertDialog.Title className="text-lg font-semibold">
              {t("share.revokeConfirmTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground mt-2 text-sm">
              {t("share.revokeConfirmDescription")}
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" data-testid="revokeCancelButton">
                  {t("share.revokeConfirmCancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="destructive"
                  data-testid="revokeConfirmButton"
                  onClick={() => {
                    if (revokeTarget) {
                      handleRevoke(revokeTarget);
                      setRevokeTarget(null);
                    }
                  }}
                >
                  {t("share.revokeConfirmAction")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog>
  );
}
