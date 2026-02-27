import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

/**
 * SECURITY NOTE: This client uses the Supabase service-role key, which
 * bypasses all Row-Level Security policies. Every query MUST include
 * explicit user_id / workspace_id filters to enforce authorization.
 *
 * All mutation endpoints should be protected by requirePermission()
 * middleware before reaching the database layer.
 *
 * TODO: Migrate user-scoped operations to use the anon key with
 * Supabase Auth JWTs so RLS acts as defense-in-depth.
 */
export function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key);
}
