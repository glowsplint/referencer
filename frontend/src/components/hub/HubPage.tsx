import { useAuth } from "@/hooks/data/use-auth";
import { useWorkspaces } from "@/hooks/data/use-workspaces";
import { useFolders } from "@/hooks/data/use-folders";
import { LoginButton } from "@/components/LoginButton";
import { UserMenu } from "@/components/UserMenu";
import { WorkspaceGrid } from "./WorkspaceGrid";
import { Button } from "@/components/ui/button";

interface HubPageProps {
  navigate: (hash: string) => void;
}

export function HubPage({ navigate }: HubPageProps) {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { workspaces, isLoading: wsLoading, create, rename, remove, duplicate, toggleFavorite, refetch: refetchWorkspaces } = useWorkspaces();
  const { folders, create: createFolder, rename: renameFolder, remove: removeFolder, moveWorkspace, unfileWorkspace } = useFolders();

  const handleTryWithoutSignIn = () => {
    const id = crypto.randomUUID();
    navigate(`#/${id}`);
  };

  const handleNewWorkspace = async () => {
    const id = crypto.randomUUID();
    await create(id);
    navigate(`#/${id}`);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Referencer</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!authLoading && (isAuthenticated ? <UserMenu /> : <LoginButton />)}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {!isAuthenticated && !authLoading ? (
          /* Guest hero */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="max-w-md text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight">Referencer</h1>
              <p className="text-muted-foreground text-lg">
                Annotate, highlight, and connect passages side by side. A collaborative workspace
                for close reading.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleTryWithoutSignIn}
                  data-testid="tryWithoutSignIn"
                >
                  Try without signing in
                </Button>
                <Button size="lg" onClick={() => login("google")} data-testid="heroSignIn">
                  Sign in
                </Button>
              </div>
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
              onMoveWorkspaceToFolder={moveWorkspace}
              onUnfileWorkspace={unfileWorkspace}
              onRefetchWorkspaces={refetchWorkspaces}
              ownerName={user?.name}
              ownerAvatarUrl={user?.avatarUrl}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
