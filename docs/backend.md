# Backend

The backend is a TypeScript server running on Bun with the Hono framework. It handles authentication, share links, and serves the production SPA. Real-time collaboration is handled separately by the collab server (see `collab-server/`).

## Entry Point

`backend/src/index.ts` initializes:
1. SQLite database (WAL mode, foreign keys enabled)
2. OAuth providers from environment variables
3. Hono routes (auth, share API, static files)
4. Periodic session cleanup (hourly)

The server exports Bun's native `fetch` handler.

## Routes

### Authentication (`/auth/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/:provider` | Start OAuth flow (redirects to provider) |
| `GET` | `/auth/:provider/callback` | OAuth callback (Google, Facebook) |
| `POST` | `/auth/:provider/callback` | OAuth callback (Apple sends POST) |
| `GET` | `/auth/me` | Check current session, returns user or `{ authenticated: false }` |
| `POST` | `/auth/logout` | End session, clear cookie |

Supported providers: `google`, `apple`, `facebook`. Providers are only enabled when their required environment variables are set.

### Share Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/share` | Create share link. Body: `{ workspaceId, access: "edit" \| "readonly" }`. Returns: `{ code, url }` |
| `GET` | `/s/:code` | Resolve share link. Redirects to `/space/{workspaceId}` (with `?access=readonly` if applicable) |

Share codes are 6-character alphanumeric strings with retry on collision (up to 5 attempts).

### Static Files

In production, the backend serves the built frontend SPA from `frontend/dist/`. Unmatched routes fall through to `index.html` for client-side routing. The base path is `/referencer/`.

## Authentication System

The auth system follows the **Backend-for-Frontend (BFF)** pattern. OAuth tokens never reach the frontend. The frontend only sees an HttpOnly session cookie.

Authentication is **optional** -- the app works fully for anonymous users. When authenticated, user identity is available but no features are gated behind login.

### OAuth Flow

1. Frontend calls `loginWith(provider)` which navigates to `/auth/{provider}`
2. Backend generates OAuth `state` (and PKCE `code_verifier` for Google)
3. State stored in `__auth_state` HttpOnly cookie (10min TTL)
4. User redirected to provider's authorization URL
5. Provider redirects back to `/auth/{provider}/callback` with `code` and `state`
6. Backend verifies state, exchanges code for tokens
7. User profile extracted from provider API or ID token
8. User upserted in database (accounts linked by email)
9. Session token (64-char hex, 32 random bytes) stored in `session` table
10. `__session` HttpOnly cookie set (30-day default, sliding window refresh)

### Session Management

- **Cookie**: `__session`, HttpOnly, Secure (production), SameSite=Lax, 30-day default
- **Sliding refresh**: Sessions older than 24h are refreshed on use
- **Cleanup**: Expired sessions deleted hourly via `cleanExpiredSessions()`

### Account Linking

When signing in, the system checks in order:
1. By provider ID (`user_provider` table) -- returns existing user
2. By email (`user` table) -- links new provider to existing user
3. Neither found -- creates new user and provider record

### Provider Notes

- **Google**: Uses PKCE (`code_verifier`/`code_challenge`). User info from OIDC userinfo endpoint.
- **Apple**: Callback is POST (not GET). User name only sent on first authorization. ID token is JWT.
- **Facebook**: Standard OAuth code flow. Profile picture from Graph API.

## Database Schema

SQLite with WAL mode and foreign keys. Schema defined inline in `backend/src/db/database.ts`.

### Tables

```
workspace
├── id TEXT (PK)
└── created_at TEXT

share_link
├── code TEXT (PK, 6-char alphanumeric)
├── workspace_id TEXT (FK -> workspace, CASCADE)
├── access TEXT (CHECK: 'edit' or 'readonly')
└── created_at TEXT

user
├── id TEXT (PK, UUID)
├── email TEXT (UNIQUE INDEX)
├── name TEXT
├── avatar_url TEXT
├── created_at TEXT
└── updated_at TEXT

user_provider
├── id TEXT (PK, UUID)
├── user_id TEXT (FK -> user, CASCADE)
├── provider TEXT
├── provider_user_id TEXT
├── created_at TEXT
└── UNIQUE(provider, provider_user_id)

session
├── id TEXT (PK, 64-char hex token)
├── user_id TEXT (FK -> user, CASCADE)
├── created_at TEXT
└── expires_at TEXT (INDEX)
```

### Relationships

- `workspace` 1 -- N `share_link`
- `user` 1 -- N `user_provider`
- `user` 1 -- N `session`

## Source Layout

```
backend/src/
├── index.ts              # Entry point, Hono app setup
├── types.ts              # Shared TypeScript interfaces
├── api/
│   └── share.ts          # POST /api/share, GET /s/:code handlers
├── auth/
│   ├── config.ts         # AuthConfig type and env var loading
│   ├── providers.ts      # Arctic provider initialization
│   ├── handlers.ts       # OAuth routes (start, callback, me, logout)
│   ├── middleware.ts      # optionalAuth middleware
│   └── store.ts          # User upsert, session CRUD
├── db/
│   ├── database.ts       # openDatabase(), schema DDL
│   └── share-queries.ts  # Share link create/resolve
└── lib/
    └── utils.ts          # generateCode utility
```
