import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "./types";
import type { Logger } from "./lib/logger";
import type { Metrics } from "./lib/metrics";

// Secrets — set via `wrangler secret put <NAME>` from backend/
//
// SUPABASE_URL           — Supabase project URL (e.g. https://xxx.supabase.co)
//                          Provider: Supabase Dashboard → Settings → API
//                          Also set in: collab-server
//
// SUPABASE_SERVICE_KEY   — Supabase service-role key (full DB access)
//                          Provider: Supabase Dashboard → Settings → API
//                          Also set in: collab-server
//
// WS_JWT_SECRET          — Secret for signing WebSocket auth JWTs
//                          Also set in: collab-server (for verification)
//                          Must be the same value in both workers.
//
// WS_JWT_SECRET_PREV     — Previous JWT secret for key rotation (optional)
//                          Also set in: collab-server
//                          Set in both workers when rotating WS_JWT_SECRET.
//
// GOOGLE_CLIENT_ID       — Google OAuth 2.0 client ID (optional)
// GOOGLE_CLIENT_SECRET   — Google OAuth 2.0 client secret (optional)
//                          Provider: Google Cloud Console → APIs & Services → Credentials
//                          Callback URL: {BASE_URL}/auth/google/callback
//                          OAuth only works when both ID and secret are set.
//
// GITHUB_CLIENT_ID       — GitHub OAuth app client ID (optional)
// GITHUB_CLIENT_SECRET   — GitHub OAuth app client secret (optional)
//                          Provider: GitHub → Settings → Developer settings → OAuth Apps
//                          Callback URL: {BASE_URL}/auth/github/callback
//                          OAuth only works when both ID and secret are set.
//
// GITHUB_ISSUES_TOKEN    — GitHub personal access token for creating feedback issues (optional)
//                          Provider: GitHub → Settings → Developer settings → Fine-grained tokens
//                          Scope: Issues (write) on the target repo
//                          Feedback endpoint returns 503 without this.
//
// GITHUB_ISSUES_REPO     — GitHub API URL for feedback issues (optional)
//                          Default: https://api.github.com/repos/glowsplint/referencer/issues
//
// SESSION_MAX_AGE        — Session cookie lifetime in seconds (optional)
//                          Default: 2592000 (30 days)
//
// Vars — set in backend/wrangler.toml [vars]
//
// FRONTEND_URL           — Public frontend URL, used for CORS and OAuth callbacks
//                          Default: https://referencer.pages.dev
//
// BASE_URL               — Public backend URL, used for OAuth callback URLs
//                          Default: https://referencer.pages.dev
//
// Bindings — configured in backend/wrangler.toml
//
// RATE_LIMIT_KV          — KV namespace for rate limiting
//
// METRICS                — Analytics Engine dataset for request/event metrics
//                          Dataset: referencer_metrics

export type Env = {
  Bindings: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    FRONTEND_URL: string;
    BASE_URL: string;
    RATE_LIMIT_KV: KVNamespace;
    METRICS: AnalyticsEngineDataset;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    SESSION_MAX_AGE?: string;
    GITHUB_ISSUES_TOKEN?: string;
    GITHUB_ISSUES_REPO?: string;
    WS_JWT_SECRET: string;
    WS_JWT_SECRET_PREV?: string;
  };
  Variables: {
    user: User | null;
    supabase: SupabaseClient;
    logger: Logger;
    metrics: Metrics;
  };
};
