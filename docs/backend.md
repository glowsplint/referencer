# Backend

The backend is a **Cloudflare Worker** (`referencer-api`) using the Hono framework with Supabase as the database. It handles authentication, share links, workspace/folder management, user preferences, and feedback. Real-time collaboration is handled separately by the collab server (see `collab-server/`).

## Entry Point

`backend/src/index.ts` initializes:

1. Per-request Supabase client, logger, and metrics
2. CORS, CSRF protection, and security headers middleware
3. OAuth providers from environment variables (via `wrangler secret`)
4. Hono routes (auth, workspaces, folders, preferences, share, feedback)
5. Scheduled handler for hourly session cleanup

The Worker exports a `fetch` handler and a `scheduled` handler (cron).

## Routes

### Authentication (`/auth/*`)

| Method | Endpoint                   | Description                                                       |
| ------ | -------------------------- | ----------------------------------------------------------------- |
| `GET`  | `/auth/:provider`          | Start OAuth flow (redirects to provider)                          |
| `GET`  | `/auth/:provider/callback` | OAuth callback (Google, GitHub)                                   |
| `GET`  | `/auth/me`                 | Check current session, returns user or `{ authenticated: false }` |
| `POST` | `/auth/logout`             | End session, clear cookie                                         |

Supported providers: `google`, `github`. Providers are only enabled when their required environment variables are set.

### Workspaces

| Method   | Endpoint              | Description               |
| -------- | --------------------- | ------------------------- |
| `GET`    | `/api/workspaces`     | List user's workspaces    |
| `POST`   | `/api/workspaces`     | Create a workspace        |
| `PATCH`  | `/api/workspaces/:id` | Update workspace metadata |
| `DELETE` | `/api/workspaces/:id` | Delete a workspace        |

### Folders

| Method   | Endpoint           | Description         |
| -------- | ------------------ | ------------------- |
| `GET`    | `/api/folders`     | List user's folders |
| `POST`   | `/api/folders`     | Create a folder     |
| `PATCH`  | `/api/folders/:id` | Update folder       |
| `DELETE` | `/api/folders/:id` | Delete a folder     |

### Preferences

| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| `GET`  | `/api/preferences` | Get user preferences    |
| `PUT`  | `/api/preferences` | Update user preferences |

### Share Links

| Method | Endpoint            | Description                                                                                        |
| ------ | ------------------- | -------------------------------------------------------------------------------------------------- |
| `POST` | `/api/share`        | Create share link. Body: `{ workspaceId, access: "edit" \| "readonly" }`. Returns: `{ code, url }` |
| `POST` | `/api/share/accept` | Accept a share link (grants permissions to authenticated user)                                     |
| `GET`  | `/s/:code`          | Resolve share link. Redirects to frontend workspace URL                                            |

### Feedback

| Method | Endpoint        | Description                            |
| ------ | --------------- | -------------------------------------- |
| `POST` | `/api/feedback` | Submit feedback (creates GitHub issue) |

## Authentication System

The auth system follows the **Backend-for-Frontend (BFF)** pattern. OAuth tokens never reach the frontend. The frontend only sees an HttpOnly session cookie.

Authentication is **optional** -- the app works fully for anonymous users. When authenticated, user identity is available for workspace ownership, sharing, and preferences.

### OAuth Flow

1. Frontend calls `loginWith(provider)` which navigates to `/auth/{provider}`
2. Pages Functions middleware proxies to the backend Worker
3. Backend generates OAuth `state` (and PKCE `code_verifier` for Google)
4. State stored in `__auth_state` HttpOnly cookie (10min TTL)
5. User redirected to provider's authorization URL
6. Provider redirects back to `/auth/{provider}/callback` with `code` and `state`
7. Backend verifies state, exchanges code for tokens
8. User profile extracted from provider API or ID token
9. User upserted in database (accounts linked by email)
10. Session token (KSUID) stored in Supabase `session` table
11. `__session` HttpOnly cookie set (30-day default, sliding window refresh)

### Session Management

- **Cookie**: `__session`, HttpOnly, Secure (production), SameSite=Lax, 30-day default
- **Sliding refresh**: Sessions older than 24h are refreshed on use
- **Cleanup**: Expired sessions deleted hourly via scheduled cron handler
- **Cookie domain**: Derived from `x-forwarded-host` header (set by Pages Functions middleware) for correct scoping on preview deployments

### Account Linking

When signing in, the system checks in order:

1. By provider ID (`user_provider` table) -- returns existing user
2. By email (`user` table) -- links new provider to existing user
3. Neither found -- creates new user and provider record

### Provider Notes

- **Google**: Uses PKCE (`code_verifier`/`code_challenge`). User info from OIDC userinfo endpoint.
- **GitHub**: Standard OAuth code flow. Profile info from GitHub user API.

## Database

The backend uses **Supabase** (PostgreSQL) for all persistent data. The schema is defined in `supabase/schema.sql`.

### Tables

- `workspace` -- workspace metadata
- `share_link` -- short share codes with access level
- `user` -- user profiles (email, name, avatar)
- `user_provider` -- OAuth provider links
- `session` -- active sessions
- `workspace_folder` -- folder organization
- `user_workspace` -- workspace ownership/starring
- `workspace_permission` -- per-user workspace permissions (owner/editor/viewer)
- `user_preference` -- user preferences
- `yjs_document` -- Yjs document snapshots (used by collab server for persistence)

### Bindings

| Binding   | Type             | Purpose         |
| --------- | ---------------- | --------------- |
| `METRICS` | Analytics Engine | Request metrics |

## Source Layout

```
backend/src/
├── index.ts                    # Entry point, Hono app setup, middleware chain
├── types.ts                    # Shared TypeScript interfaces
├── env.ts                      # Environment/binding type definitions
├── api/
│   ├── feedback.ts             # POST /api/feedback
│   ├── folders.ts              # Folders CRUD
│   ├── preferences.ts          # Preferences get/put
│   ├── share.ts                # Share link create/accept/resolve
│   └── workspaces.ts           # Workspaces CRUD
├── auth/
│   ├── config.ts               # AuthConfig type and env var loading
│   ├── cookie-domain.ts        # Domain derivation from x-forwarded-host
│   ├── providers.ts            # Arctic provider initialization
│   ├── handlers.ts             # OAuth routes (start, callback, me, logout)
│   ├── middleware.ts            # optionalAuth middleware
│   └── store.ts                # User upsert, session CRUD
├── db/
│   ├── database.ts             # Supabase client factory
│   ├── folder-queries.ts       # Folder queries
│   ├── permission-queries.ts   # Permission queries
│   ├── preference-queries.ts   # Preference queries
│   ├── share-queries.ts        # Share link queries
│   └── workspace-queries.ts    # Workspace queries
├── lib/
│   ├── jwt.ts                  # JWT signing for WebSocket auth
│   ├── logger.ts               # Structured logging
│   ├── metrics.ts              # Analytics Engine metrics
│   ├── rate-limit.ts           # In-memory rate limiter (per-isolate)
│   └── utils.ts                # Utilities (code generation)
└── middleware/
    └── require-permission.ts   # Permission check middleware
```
