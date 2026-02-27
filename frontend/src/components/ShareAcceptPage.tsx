import { useEffect, useState } from "react";
import { apiPost, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/data/use-auth";

interface ShareAcceptPageProps {
  code: string;
  navigate: (hash: string) => void;
}

export function ShareAcceptPage({ code, navigate }: ShareAcceptPageProps) {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || accepting) return;

    setAccepting(true);
    apiPost<{ workspaceId: string }>("/api/share/accept", { code })
      .then((res) => {
        navigate(`#/${res.workspaceId}`);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("This share link is invalid or has expired.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      });
  }, [authLoading, isAuthenticated, code, navigate, accepting]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg">Sign in to accept this shared workspace</p>
        <div className="flex gap-2">
          <button
            onClick={() => login("google")}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign in with Google
          </button>
          <button
            onClick={() => login("github")}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => navigate("#/")}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Accepting shared workspace...</p>
    </div>
  );
}
