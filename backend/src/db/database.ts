import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

export function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key);
}
