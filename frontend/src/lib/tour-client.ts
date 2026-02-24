import { apiFetch } from "@/lib/api-client";

interface PreferenceItem {
  key: string;
  value: string;
  updatedAt: string;
}

export async function fetchTourPreferences(): Promise<Record<string, string>> {
  const items = await apiFetch<PreferenceItem[]>("/api/preferences");
  return Object.fromEntries(items.map((item) => [item.key, item.value]));
}

export async function saveTourPreference(key: string, value: string): Promise<void> {
  await apiFetch("/api/preferences/" + encodeURIComponent(key), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
}
