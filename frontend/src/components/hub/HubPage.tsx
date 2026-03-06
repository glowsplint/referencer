import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, TriangleAlert, Search } from "lucide-react";
import { randomKSUID } from "@/lib/ksuid";
import { useAuth } from "@/hooks/data/use-auth";
import { useDocuments } from "@/hooks/data/use-documents";
import { useFolders } from "@/hooks/data/use-folders";
import { useSettings } from "@/hooks/data/use-settings";
import { LoginButton } from "@/components/LoginButton";
import { UserMenu } from "@/components/UserMenu";
import { SettingsDialog } from "@/components/SettingsDialog";
import { DocumentGrid } from "./DocumentGrid";
import { NewDocumentDialog } from "./NewDocumentDialog";
import { Button } from "@/components/ui/button";

interface HubPageProps {
  navigate: (hash: string) => void;
}

export function HubPage({ navigate }: HubPageProps) {
  const { t } = useTranslation("management");
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const {
    documents,
    isLoading: wsLoading,
    create,
    rename,
    remove,
    duplicate,
    toggleFavorite,
    moveToFolder,
    unfileDocument,
  } = useDocuments();
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
    toggleOverscroll,
  } = useSettings();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newDocumentFolderId, setNewDocumentFolderId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleTryWithoutSignIn = () => {
    const id = randomKSUID();
    navigate(`#/${id}`);
  };

  const handleNewDocument = (currentFolderId: string | null) => {
    setNewDocumentFolderId(currentFolderId);
    setShowNewDialog(true);
  };

  const handleCreateDocument = async (title: string) => {
    setShowNewDialog(false);
    const id = randomKSUID();
    await create(id, title);
    if (newDocumentFolderId) {
      moveToFolder(id, newDocumentFolderId);
    }
  };

  const showSearch = isAuthenticated && !authLoading;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Referencer</span>
        </div>
        {showSearch && (
          <div className="flex-1 flex justify-center px-4">
            <div className="relative w-full max-w-sm">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("hub.search")}
                data-testid="hubSearchInput"
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2 ${showSearch ? "" : "ml-auto"}`}>
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
          /* Logged-in document list */
          <div className="max-w-6xl mx-auto px-6 py-8">
            <DocumentGrid
              documents={documents}
              isLoading={wsLoading}
              navigate={navigate}
              onNew={handleNewDocument}
              onRename={rename}
              onDelete={remove}
              onDuplicate={duplicate}
              onToggleFavorite={toggleFavorite}
              folders={folders}
              onCreateFolder={createFolder}
              onRenameFolder={renameFolder}
              onDeleteFolder={removeFolder}
              onMoveDocumentToFolder={moveToFolder}
              onUnfileDocument={unfileDocument}
              onToggleFolderFavorite={toggleFolderFavorite}
              onMoveFolder={moveFolder}
              ownerName={user?.name}
              ownerAvatarUrl={user?.avatarUrl}
              searchQuery={searchQuery}
            />
          </div>
        ) : null}
      </main>

      <NewDocumentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleCreateDocument}
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
        overscroll={settings.overscroll}
        toggleOverscroll={toggleOverscroll}
      />
    </div>
  );
}
