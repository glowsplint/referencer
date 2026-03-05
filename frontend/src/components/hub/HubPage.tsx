import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, TriangleAlert } from "lucide-react";
import { randomKSUID } from "@/lib/ksuid";
import { useAuth } from "@/hooks/data/use-auth";
import { useWorkspaces } from "@/hooks/data/use-workspaces";
import { useFolders } from "@/hooks/data/use-folders";
import { useSettings } from "@/hooks/data/use-settings";
import { LoginButton } from "@/components/LoginButton";
import { UserMenu } from "@/components/UserMenu";
import { SettingsDialog } from "@/components/SettingsDialog";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { NewWorkspaceDialog } from "./NewWorkspaceDialog";
import { Button } from "@/components/ui/button";

interface HubPageProps {
  navigate: (hash: string) => void;
}

export function HubPage({ navigate }: HubPageProps) {
  const { t } = useTranslation("management");
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const {
    workspaces,
    isLoading: wsLoading,
    create,
    rename,
    remove,
    duplicate,
    toggleFavorite,
    moveToFolder,
    unfileWorkspace,
  } = useWorkspaces();
  const {
    folders,
    create: createFolder,
    rename: renameFolder,
    remove: removeFolder,
    toggleFavorite: toggleFolderFavorite,
    moveFolder,
  } = useFolders();
  const {
    settings,
    toggleDarkMode,
    toggleHideOffscreenArrows,
    toggleShowStatusBar,
    toggleThirdEditorFullWidth,
  } = useSettings();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newWorkspaceFolderId, setNewWorkspaceFolderId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleTryWithoutSignIn = () => {
    const id = randomKSUID();
    navigate(`#/${id}`);
  };

  const handleNewWorkspace = (currentFolderId: string | null) => {
    setNewWorkspaceFolderId(currentFolderId);
    setShowNewDialog(true);
  };

  const handleCreateWorkspace = async (title: string) => {
    setShowNewDialog(false);
    const id = randomKSUID();
    await create(id, title);
    if (newWorkspaceFolderId) {
      moveToFolder(id, newWorkspaceFolderId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Referencer</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="hubSettingsButton"
          >
            <Settings size={20} />
          </button>
          {!authLoading && (isAuthenticated ? <UserMenu /> : <LoginButton />)}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {!isAuthenticated && !authLoading ? (
          /* Guest hero */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="max-w-lg text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight">{t("hub.title")}</h1>
              <p className="text-muted-foreground text-lg">{t("hub.tagline")}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleTryWithoutSignIn}
                  data-testid="tryWithoutSignIn"
                >
                  {t("hub.tryWithoutSignIn")}
                </Button>
                <Button size="lg" onClick={() => login("google")} data-testid="heroSignIn">
                  {t("hub.signIn")}
                </Button>
              </div>
              <p
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 mt-4"
                data-testid="guestWarningBanner"
              >
                <TriangleAlert size={14} className="shrink-0" />
                {t("hub.guestWarning")}
              </p>
            </div>
          </div>
        ) : isAuthenticated ? (
          /* Logged-in workspace list */
          <div className="max-w-6xl mx-auto px-6 py-8">
            <WorkspaceGrid
              workspaces={workspaces}
              isLoading={wsLoading}
              navigate={navigate}
              onNew={handleNewWorkspace}
              onRename={rename}
              onDelete={remove}
              onDuplicate={duplicate}
              onToggleFavorite={toggleFavorite}
              folders={folders}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={removeFolder}
              onMoveWorkspaceToFolder={moveToFolder}
              onUnfileWorkspace={unfileWorkspace}
              onToggleFolderFavorite={toggleFolderFavorite}
              onMoveFolder={moveFolder}
              ownerName={user?.name}
              ownerAvatarUrl={user?.avatarUrl}
            />
          </div>
        ) : null}
      </main>

      <NewWorkspaceDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleCreateWorkspace}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isDarkMode={settings.isDarkMode}
        toggleDarkMode={toggleDarkMode}
        hideOffscreenArrows={settings.hideOffscreenArrows}
        toggleHideOffscreenArrows={toggleHideOffscreenArrows}
        showStatusBar={settings.showStatusBar}
        toggleShowStatusBar={toggleShowStatusBar}
        thirdEditorFullWidth={settings.thirdEditorFullWidth}
        toggleThirdEditorFullWidth={toggleThirdEditorFullWidth}
      />
    </div>
  );
}
