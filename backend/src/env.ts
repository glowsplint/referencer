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
    APPLE_CLIENT_ID?: string;
    APPLE_PRIVATE_KEY?: string;
    APPLE_TEAM_ID?: string;
    APPLE_KEY_ID?: string;
    FACEBOOK_CLIENT_ID?: string;
    FACEBOOK_CLIENT_SECRET?: string;
    SESSION_MAX_AGE?: string;
  };
  Variables: {
    user: User | null;
    supabase: SupabaseClient;
  };
};
