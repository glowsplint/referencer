import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "./types";

export type Env = {
  Bindings: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    FRONTEND_URL: string;
    BASE_URL: string;
    RATE_LIMIT_KV: KVNamespace;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    SESSION_MAX_AGE?: string;
    GITHUB_ISSUES_TOKEN?: string;
  };
  Variables: {
    user: User | null;
    supabase: SupabaseClient;
  };
};
