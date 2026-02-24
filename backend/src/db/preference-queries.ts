import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserPreference {
  key: string;
  value: string;
  updatedAt: string;
}

export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreference[]> {
  const { data, error } = await supabase
    .from("user_preference")
    .select("key, value, updated_at")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to list preferences: ${error.message}`);
  if (!data) return [];

  return data.map((row) => ({
    key: row.key,
    value: row.value,
    updatedAt: row.updated_at,
  }));
}

export async function getUserPreference(
  supabase: SupabaseClient,
  userId: string,
  key: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_preference")
    .select("value")
    .eq("user_id", userId)
    .eq("key", key)
    .single();

  if (error || !data) return null;

  return data.value;
}

export async function upsertUserPreference(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  value: string,
): Promise<void> {
  const { error } = await supabase.from("user_preference").upsert(
    {
      user_id: userId,
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" },
  );

  if (error) throw new Error(`Failed to upsert preference: ${error.message}`);
}
