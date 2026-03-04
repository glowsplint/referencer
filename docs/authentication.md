# Authentication System

## Architecture Overview

The auth system follows the **Backend-for-Frontend (BFF)** pattern. OAuth tokens never reach the frontend -- all token exchange and session management happens server-side. The frontend only sees an HttpOnly session cookie.

Authentication is **optional**. The application works fully for anonymous users. When authenticated, the user identity is attached to requests but no features are gated behind login (currently).

## Supported Providers

| Provider | Protocol         | ID Token   | Notes                               |
| -------- | ---------------- | ---------- | ----------------------------------- |
| Google   | OAuth 2.0 + PKCE | Yes (OIDC) | User info from userinfo endpoint    |
| GitHub   | OAuth 2.0        | No         | User info from /user + /user/emails |

### Provider Details

- **Google** uses PKCE (`code_verifier`/`code_challenge`) for additional security. User info is fetched from the OpenID Connect userinfo endpoint.
- **GitHub** does not use PKCE. User info is fetched from the GitHub REST API (`/user` and `/user/emails` endpoints). The numeric user ID is converted to a string. The `name` field may be null, in which case the `login` (username) is used as a fallback. Scopes requested: `read:user`, `user:email`.

## OAuth Flow

The complete flow from login click to authenticated session:

1. **User clicks "Sign in with Google"** -- Frontend calls `loginWith("google")` which sets `window.location.href = /auth/google`.
2. **Backend generates OAuth state** -- `GET /auth/:provider` creates a random `state` parameter and `code_verifier` for PKCE.
3. **State stored in cookie** -- The `__auth_state` cookie (HttpOnly, 10min TTL) stores the state and code verifier.
4. **Redirect to provider** -- The user is redirected to Google's authorization URL with appropriate scopes.
5. **User authorizes** -- The user logs in and grants permission at Google's site.
6. **Provider redirects back** -- Google redirects to `/auth/google/callback` with `code` and `state` query parameters.
7. **State verification** -- The backend reads `__auth_state` from the cookie and compares the returned `state` to prevent CSRF.
8. **Code exchange** -- The authorization code is exchanged for tokens using Google's token endpoint.
9. **User info extraction** -- User profile (email, name, avatar) is extracted from the Google userinfo endpoint.
10. **User upsert** -- `upsertUser()` finds or creates the user, handling account linking by email.
11. **Session creation** -- A 64-character hex session token is generated and stored in the `session` table with an expiry.
12. **Session cookie set** -- The `__session` cookie (HttpOnly, Secure in production, SameSite=Lax) is set with the token.
13. **Redirect to app** -- The user is redirected to `/` and the frontend picks up the session via `GET /auth/me`.

## Session Management

### Storage

Sessions are stored in the SQLite `session` table with fields:

- `id`: 64-character hex token (32 random bytes)
- `user_id`: Reference to the `user` table
- `created_at`: When the session was created/last refreshed
- `expires_at`: Absolute expiry timestamp

### Cookie

- Name: `__session`
- HttpOnly: Yes (not accessible via JavaScript)
- Secure: Yes in production, No in development
- SameSite: Lax
- Path: `/`
- MaxAge: Configured via `SESSION_MAX_AGE` (default 30 days)

### Sliding Window Refresh

When a session is used and its `created_at` is more than 24 hours old, the session is refreshed:

- `created_at` is updated to now
- `expires_at` is extended by `SESSION_MAX_AGE`

This means active users never need to re-login, while inactive sessions expire naturally.

### Cleanup

`cleanExpiredSessions()` deletes all sessions where `expires_at < now`. This should be called periodically (e.g., on a timer or cron job).

## Account Linking

When a user signs in, the system checks for existing accounts in order:

1. **By provider ID** (`user_provider.provider` + `provider_user_id`): If found, update user info and return the existing user.
2. **By email** (`user.email`): If found, link the new provider to the existing user (creates a new `user_provider` row) and return the existing user.
3. **New user**: Create both a `user` and `user_provider` row.

This means if a new provider is added in the future and a user signs in with the same email, the providers will be linked to one account.

## Security Measures

- **PKCE** (Google): Prevents authorization code interception attacks.
- **State parameter**: Random state stored in an HttpOnly cookie prevents CSRF attacks on the OAuth callback.
- **HttpOnly cookies**: Session tokens are never accessible to client-side JavaScript, preventing XSS-based token theft.
- **SameSite=Lax**: Prevents the session cookie from being sent in cross-origin requests (CSRF protection).
- **Secure flag** (production): Ensures cookies are only sent over HTTPS.
- **No tokens in frontend**: OAuth access tokens, refresh tokens, and ID tokens never leave the backend.
- **Session token entropy**: 32 random bytes (256 bits) provides sufficient entropy against brute-force attacks.

## API Reference

### `GET /auth/:provider`

Start the OAuth flow. Redirects the user to the provider's authorization page.

**Parameters:**

- `:provider` -- `google`, `github`

**Response:** 302 redirect to provider

### `GET /auth/:provider/callback`

OAuth callback handler.

**Query Parameters:**

- `code` -- Authorization code from provider
- `state` -- State parameter for CSRF verification

**Response:** 302 redirect to `/` on success, JSON error on failure

### `GET /auth/me`

Check current authentication status.

**Response (authenticated):**

```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (not authenticated):**

```json
{
  "authenticated": false
}
```

### `POST /auth/logout`

End the current session.

**Response:**

```json
{
  "ok": true
}
```

## Configuration

| Environment Variable   | Description                                        | Default                 |
| ---------------------- | -------------------------------------------------- | ----------------------- |
| `BASE_URL`             | Public URL of the backend (used for callback URLs) | `http://localhost:5000` |
| `NODE_ENV`             | Set to `production` to enable Secure cookies       | -                       |
| `SESSION_MAX_AGE`      | Session lifetime in seconds                        | `2592000` (30 days)     |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                             | -                       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                         | -                       |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID                             | -                       |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret                         | -                       |

Google is only enabled when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. GitHub is only enabled when both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set. If not configured, the auth endpoint returns 404.

## Database Schema

```
user
├── id TEXT (PK, UUID)
├── email TEXT (UNIQUE INDEX)
├── name TEXT
├── avatar_url TEXT
├── created_at TEXT
└── updated_at TEXT

user_provider
├── id TEXT (PK, UUID)
├── user_id TEXT (FK → user.id, CASCADE)
├── provider TEXT
├── provider_user_id TEXT
├── created_at TEXT
└── UNIQUE(provider, provider_user_id)

session
├── id TEXT (PK, 64-char hex token)
├── user_id TEXT (FK → user.id, CASCADE)
├── created_at TEXT
└── expires_at TEXT (INDEX)
```

Relationships:

- `user` 1 ←→ N `user_provider` (one user can have multiple OAuth providers)
- `user` 1 ←→ N `session` (one user can have multiple active sessions)
