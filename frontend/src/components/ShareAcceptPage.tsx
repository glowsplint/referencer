import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiPost, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/data/use-auth";

interface ShareAcceptPageProps {
  code: string;
  navigate: (hash: string) => void;
}

export function ShareAcceptPage({ code, navigate }: ShareAcceptPageProps) {
  const { t } = useTranslation("dialogs");
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [error, setError] = useState<"expired" | "generic" | null>(null);
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
          setError("expired");
        } else {
          setError("generic");
        }
      });
  }, [authLoading, isAuthenticated, code, navigate, accepting]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("share.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg">{t("share.acceptSignIn")}</p>
        <div className="flex gap-2">
          <button
            onClick={() => login("google")}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("share.loginGoogle")}
          </button>
          <button
            onClick={() => login("github")}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("share.loginGithub")}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          {error === "expired" ? t("share.acceptExpired") : t("share.acceptError")}
        </p>
        <button
          onClick={() => navigate("#/hub")}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("share.goToHub")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">{t("share.accepting")}</p>
    </div>
  );
}
