import { useAuth } from "@/hooks/data/use-auth";

export function UnsavedBanner() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || isAuthenticated) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm shrink-0"
      data-testid="unsavedBanner"
    >
      <span>Sign in to save your work</span>
    </div>
  );
}
