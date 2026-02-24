// Resolves the current user's display name for comment attribution.
// Priority: OAuth name > localStorage USER_NAME > "You" fallback.
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS } from "@/constants/storage-keys";

export function useCurrentUserName(): string {
  const { user } = useAuth();
  if (user?.name) return user.name;
  const stored = localStorage.getItem(STORAGE_KEYS.USER_NAME);
  if (stored) return stored;
  return "You";
}
