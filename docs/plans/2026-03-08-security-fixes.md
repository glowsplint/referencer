# Security Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all Critical, High, and Medium security findings from the security audit across backend, collab-server, frontend, database, and CI/CD.

**Architecture:** Fixes are organized in 5 phases by blast radius — database/schema first, then backend API, collab-server, frontend, and finally CI/CD. Each phase is independently testable.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers, Supabase PostgreSQL, Vite/React, GitHub Actions

---

## Phase 1: Database & Schema Fixes

### Task 1: Fix `yjs_document` deletion bug (C3)

**Files:**
- Modify: `backend/src/db/document-queries.ts:159`

**Step 1: Fix the column name**

In `deleteDocumentCascade`, change `document_id` to `room_name`:

```typescript
// Line 159 — was: .eq("document_id", documentId)
await supabase.from("yjs_document").delete().eq("room_name", documentId);
```

**Step 2: Simplify cascade delete**

Since all child tables have `ON DELETE CASCADE` FKs to `document(id)`, the manual pre-deletion of `share_link`, `document_tag`, `user_document`, and `document_permission` is unnecessary — only `yjs_document` (no FK) and `document` need explicit deletes. Replace `deleteDocumentCascade`:

```typescript
export async function deleteDocumentCascade(
  supabase: SupabaseClient,
  documentId: string,
): Promise<void> {
  // yjs_document has no FK to document, so delete it explicitly
  await supabase.from("yjs_document").delete().eq("room_name", documentId);
  // Deleting the document cascades to: share_link, document_tag,
  // user_document, document_permission, annotation_index
  await supabase.from("document").delete().eq("id", documentId);
}
```

**Step 3: Run backend tests**

Run: `cd backend && bun test`

**Step 4: Commit**

```
fix: use correct column name for yjs_document deletion

The cascade delete used .eq("document_id", ...) but yjs_document's PK
is room_name. This silently left orphaned Yjs data after document
deletion. Also simplified cascade to rely on DB-level ON DELETE CASCADE.
```

---

### Task 2: Add FK to `yjs_document` schema (H3)

**Files:**
- Modify: `supabase/schema.sql:50-54`

**Step 1: Add foreign key constraint**

Replace the `yjs_document` table definition:

```sql
CREATE TABLE yjs_document (
    room_name TEXT PRIMARY KEY REFERENCES document(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Step 2: Commit**

```
fix: add FK constraint from yjs_document to document

Ensures database-level cascade delete and prevents orphaned Yjs data
from documents deleted outside the application layer.
```

---

## Phase 2: Backend API Security Fixes

### Task 3: Add permission checks to PDF endpoints (C1, C2) + path traversal fix (H1) + size limit (H2)

**Files:**
- Modify: `backend/src/api/pdf.ts`

**Step 1: Rewrite pdf.ts with all fixes**

```typescript
import { Hono } from "hono";
import type { Env } from "../env";
import { requirePermission } from "../middleware/require-permission";

export const pdf = new Hono<Env>();

const MAX_PDF_BASE64_LENGTH = 20_000_000; // ~15MB binary

// Validate filename: alphanumeric, hyphens, underscores, dots only. No path separators.
function isValidFilename(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name) && !name.includes("..");
}

// Upload PDF (base64 in JSON body to satisfy CSRF middleware)
// Note: The Supabase Storage bucket "document-pdfs" must exist.
pdf.post("/:id/pdf", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const body = await c.req.json<{ paneIndex: number; filename: string; data: string }>();

  if (!body.data || !body.filename) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Validate paneIndex is a non-negative integer
  if (typeof body.paneIndex !== "number" || !Number.isInteger(body.paneIndex) || body.paneIndex < 0) {
    return c.json({ error: "paneIndex must be a non-negative integer" }, 400);
  }

  // Validate filename (no path traversal)
  if (!isValidFilename(body.filename)) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  // Enforce size limit
  if (body.data.length > MAX_PDF_BASE64_LENGTH) {
    return c.json({ error: "File too large (max 15MB)" }, 413);
  }

  const supabase = c.get("supabase");

  // Decode base64 to binary
  const binaryStr = atob(body.data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const storageKey = `${id}/${body.paneIndex}/${body.filename}`;

  const { error: uploadError } = await supabase.storage
    .from("document-pdfs")
    .upload(storageKey, bytes.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    const log = c.get("logger");
    log.error("PDF upload failed", { error: String(uploadError) });
    return c.json({ error: "Upload failed" }, 500);
  }

  return c.json({ storageKey });
});

// Get signed URL for PDF
pdf.get("/:id/pdf/:key{.+}", requirePermission("viewer"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const storageKey = c.req.param("key");

  // Validate the key belongs to this document (prevent path traversal)
  if (!storageKey.startsWith(`${id}/`)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const supabase = c.get("supabase");

  const { data, error } = await supabase.storage
    .from("document-pdfs")
    .createSignedUrl(storageKey, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return c.json({ error: "Failed to generate URL" }, 500);
  }

  return c.json({ url: data.signedUrl });
});
```

**Step 2: Run backend build**

Run: `cd backend && bunx tsc --noEmit`

**Step 3: Commit**

```
fix: add permission checks, path traversal protection, and size limits to PDF endpoints

- POST /:id/pdf now requires 'editor' permission (was auth-only)
- GET /:id/pdf/:key now requires 'viewer' permission (was auth-only)
- Filename sanitized to prevent path traversal via ../
- Storage key validated to belong to the document ID
- File size capped at ~15MB to prevent memory exhaustion
- paneIndex validated as non-negative integer
```

---

### Task 4: Add permission check to ws-ticket endpoint (M4)

**Files:**
- Modify: `backend/src/auth/handlers.ts:121-151`

**Step 1: Add permission check before issuing JWT**

```typescript
// In the ws-ticket handler, after `if (!body.room)` check, add:
const supabase = c.get("supabase");
const { getPermission } = await import("../db/permission-queries");
const role = await getPermission(supabase, body.room, user.id);
if (!role) {
  log.warn("POST /auth/ws-ticket denied — no permission", {
    userId: user.id,
    room: body.room,
  });
  return c.json({ error: "Forbidden" }, 403);
}
```

Actually, to avoid dynamic import, add the import at the top of handlers.ts and inline the check. The full change to the ws-ticket handler:

At the top of `handlers.ts`, add to imports:
```typescript
import { getPermission } from "../db/permission-queries";
```

Then modify the ws-ticket handler body (inside the try block, after `if (!body.room)` check):

```typescript
      // Verify user has permission on this document before issuing a ticket
      const supabase = c.get("supabase");
      const role = await getPermission(supabase, body.room, user.id);
      if (!role) {
        log.warn("POST /auth/ws-ticket denied — no permission", {
          userId: user.id,
          room: body.room,
        });
        return c.json({ error: "Forbidden" }, 403);
      }
```

**Step 2: Run backend build**

Run: `cd backend && bunx tsc --noEmit`

**Step 3: Commit**

```
fix: verify document permission before issuing ws-ticket JWT

Previously any authenticated user could get a WebSocket ticket for any
document room. Now the endpoint checks document_permission first.
```

---

### Task 5: Add permission check to tag DELETE (M10)

**Files:**
- Modify: `backend/src/api/tags.ts:79-103`

**Step 1: Add permission check to DELETE handler**

Replace the DELETE handler:

```typescript
// DELETE /:documentId/:tag - remove tag from document
tags.delete("/:documentId/:tag", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const log = c.get("logger");

  try {
    const documentId = c.req.param("documentId");
    const tag = decodeURIComponent(c.req.param("tag"));
    const supabase = c.get("supabase");

    const role = await getPermission(supabase, documentId, user.id);
    if (!role || !hasMinimumRole(role, "viewer")) {
      log.warn("Permission denied for remove tag", {
        userId: user.id,
        documentId,
      });
      return c.json({ error: "Forbidden" }, 403);
    }

    await removeTag(supabase, user.id, documentId, tag);
    log.info("DELETE /api/tags/:documentId/:tag", {
      userId: user.id,
      documentId,
      tag,
    });
    return c.json({ ok: true });
  } catch (err) {
    log.error("DELETE /api/tags/:documentId/:tag failed", {
      userId: user.id,
      documentId: c.req.param("documentId"),
      error: String(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
});
```

**Step 2: Run backend build**

Run: `cd backend && bunx tsc --noEmit`

**Step 3: Commit**

```
fix: add permission check to tag DELETE endpoint

Consistent with the POST (add tag) endpoint which already checks
permission. Prevents tag deletion after document permission is revoked.
```

---

### Task 6: Validate folder ownership on move-document (M11)

**Files:**
- Modify: `backend/src/api/folders.ts:194-231`

**Step 1: Add folder ownership check**

In the `PATCH /:id/move-document` handler, after the document permission check and before calling `moveDocumentToFolder`, add:

```typescript
    // Verify the target folder belongs to the user
    const { data: folder } = await supabase
      .from("document_folder")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single();
    if (!folder) {
      log.warn("Permission denied for move-document — folder not owned", {
        userId: user.id,
        folderId,
      });
      return c.json({ error: "Folder not found" }, 404);
    }
```

**Step 2: Run backend build**

Run: `cd backend && bunx tsc --noEmit`

**Step 3: Commit**

```
fix: verify target folder ownership before moving document

Prevents a user from setting their document's folder_id to a folder
belonging to another user.
```

---

### Task 7: Fix share link `expiresAt: null` bypass (M9)

**Files:**
- Modify: `backend/src/db/share-queries.ts:14-17`

**Step 1: Enforce maximum expiry and reject null**

Replace the `expires_at` logic in `createShareLink`:

```typescript
    const MAX_SHARE_DAYS = 90;
    let expires_at: string;
    if (expiresAt && typeof expiresAt === "string") {
      const parsed = new Date(expiresAt);
      const maxDate = new Date(Date.now() + MAX_SHARE_DAYS * 24 * 60 * 60 * 1000);
      if (isNaN(parsed.getTime()) || parsed <= new Date()) {
        throw new Error("expiresAt must be a valid future date");
      }
      expires_at = parsed > maxDate ? maxDate.toISOString() : parsed.toISOString();
    } else {
      expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
```

**Step 2: Run backend build**

Run: `cd backend && bunx tsc --noEmit`

**Step 3: Commit**

```
fix: prevent perpetual share links by enforcing max 90-day expiry

Previously passing expiresAt: null created a share link with no
expiration. Now all share links have a default 30-day or max 90-day
expiry.
```

---

### Task 8: Fix `deleteDocumentCascade` atomicity (M8)

Already addressed in Task 1 — the simplified version (delete yjs_document then document) relies on DB cascades and has only 2 operations instead of 6. The worst case is an orphaned yjs_document row which the FK from Task 2 prevents.

No additional work needed.

---

## Phase 3: Collab Server Security Fixes

### Task 9: Add JWT `alg` header validation (M1)

**Files:**
- Modify: `collab-server/src/jwt.ts:15-43`

**Step 1: Add algorithm validation**

After splitting the token and before signature verification, add:

```typescript
async function verifyWithSecret(token: string, secret: string): Promise<WsJwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;

  // Validate algorithm
  try {
    const hdr = JSON.parse(base64urlDecode(header));
    if (hdr.alg !== "HS256") return null;
  } catch {
    return null;
  }

  const data = new TextEncoder().encode(`${header}.${body}`);
  // ... rest unchanged
```

**Step 2: Add `iss`/`aud` claim validation (M2)**

After parsing the payload and checking expiry, add:

```typescript
  const payload: WsJwtPayload = JSON.parse(base64urlDecode(body));

  // Check expiry
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  // Validate issuer and audience
  if (payload.iss !== "referencer" || payload.aud !== "collab") return null;

  return payload;
```

Note: The collab-server `index.ts` already checks `iss`/`aud` at line 96-99. Adding it to the JWT verification function provides defense-in-depth. The duplicate check in `index.ts` can be kept or removed — keeping it is fine for clarity.

**Step 3: Run collab-server tests**

Run: `cd collab-server && bun run test`

**Step 4: Commit**

```
fix: validate JWT alg header and iss/aud claims in verification

Defense-in-depth: reject tokens with unexpected algorithm or
issuer/audience at the crypto layer, not just the route handler.
```

---

### Task 10: Fix CORS default to deny on collab server (H5)

**Files:**
- Modify: `collab-server/src/index.ts:57-63`

**Step 1: Change CORS to deny by default**

```typescript
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.ALLOWED_ORIGIN;
      if (!allowed) return null; // deny by default
      return origin === allowed ? allowed : null;
    },
    credentials: true,
  }),
);
```

**Step 2: Update the comment at line 24-25**

```typescript
// ALLOWED_ORIGIN         — CORS origin for WebSocket connections (required in production)
//                          Denied by default if not set.
```

**Step 3: Add Origin validation to WebSocket upgrade handler**

In the `GET /:roomName` handler, after the token check, add Origin validation:

```typescript
  // Validate Origin header for WebSocket upgrade (CORS doesn't protect WS upgrades)
  const origin = c.req.header("origin");
  const allowedOrigin = c.env.ALLOWED_ORIGIN;
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    log.warn("GET /:roomName rejected — origin mismatch", { roomName, origin });
    return c.json({ error: "Forbidden" }, 403);
  }
```

**Step 4: Run collab-server tests**

Run: `cd collab-server && bun run test`

**Step 5: Commit**

```
fix: default CORS to deny when ALLOWED_ORIGIN is not set

Also validates Origin header on WebSocket upgrade requests, which are
not protected by CORS preflight.
```

---

### Task 11: Add WebSocket message size limit (M5) and connection limit (M6)

**Files:**
- Modify: `collab-server/src/durable-object.ts`

**Step 1: Add constants at the top**

```typescript
const MAX_MESSAGE_SIZE = 256 * 1024; // 256KB
const MAX_CONNECTIONS_PER_ROOM = 50;
```

**Step 2: Add connection limit in `fetch`**

Before `const pair = new WebSocketPair()`, add:

```typescript
      // Enforce connection limit per room
      if (this.ctx.getWebSockets().length >= MAX_CONNECTIONS_PER_ROOM) {
        this.log.warn("Connection limit reached", { roomName, limit: MAX_CONNECTIONS_PER_ROOM });
        return new Response("Too many connections", { status: 503 });
      }
```

**Step 3: Add message size check in `webSocketMessage`**

After `if (data.length === 0) return;`, add:

```typescript
    if (data.length > MAX_MESSAGE_SIZE) {
      this.log.warn("Message exceeds size limit", {
        roomName: this.roomName,
        size: data.length,
        limit: MAX_MESSAGE_SIZE,
      });
      ws.close(1009, "Message too large");
      return;
    }
```

**Step 4: Add read-only check to force save (M17)**

In the `webSocketMessage` handler, change the force save branch:

```typescript
      } else if (messageType === MSG_FORCE_SAVE) {
        if (this.isReadOnly(ws)) {
          this.log.warn("Read-only client attempted force save", { roomName: this.roomName });
          return;
        }
        await this.handleForceSave(ws);
      }
```

**Step 5: Run collab-server tests**

Run: `cd collab-server && bun run test`

**Step 6: Commit**

```
fix: add WS message size limit, connection cap, and force-save auth

- Reject messages > 256KB to prevent memory exhaustion
- Cap room connections at 50 to prevent DoS amplification
- Block force-save from read-only viewers
```

---

## Phase 4: Frontend & Dependency Fixes

### Task 12: Update vulnerable dependencies (C4, H7)

**Step 1: Update DOMPurify (Critical XSS bypass)**

```bash
cd frontend && bun update dompurify
```

**Step 2: Update Hono in backend and collab-server**

```bash
cd backend && bun update hono
cd collab-server && bun update hono
```

**Step 3: Run all tests to verify nothing broke**

```bash
cd frontend && bun run test:run
cd backend && bun test
cd collab-server && bun run test
```

**Step 4: Commit**

```
fix: update dompurify and hono to patch known CVEs

- dompurify: XSS bypass (GHSA-v2wj-7wpq-c8vv)
- hono: multiple vulns including serveStatic file access, auth bypass
```

---

### Task 13: Fix frontend CSP — remove `ws:`, tighten `connect-src` (M14)

**Files:**
- Modify: `frontend/index.html:9`

**Step 1: Remove `ws:` from connect-src**

```html
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleusercontent.com https://avatars.githubusercontent.com; connect-src 'self' wss:; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self';"
    />
```

(Changed `wss: ws:` to just `wss:`)

**Step 2: Run frontend build**

Run: `cd frontend && bun run build`

**Step 3: Commit**

```
fix: remove ws: from CSP connect-src, only allow encrypted wss:

Unencrypted WebSocket connections should not be allowed in production.
Dev uses same-origin proxy so ws: is not needed.
```

---

### Task 14: Self-host PDF.js worker (M18)

**Files:**
- Modify: `frontend/src/components/PdfPane.tsx:8`

**Step 1: Copy the worker to public/**

```bash
cp frontend/node_modules/pdfjs-dist/build/pdf.worker.min.mjs frontend/public/pdf.worker.min.mjs
```

**Step 2: Update the worker source**

```typescript
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
```

**Step 3: Run frontend build + tests**

```bash
cd frontend && bun run build
cd frontend && bun run test:run
```

**Step 4: Commit**

```
fix: self-host PDF.js worker instead of loading from unpkg CDN

Eliminates third-party supply chain risk. The worker is now served
from the same origin, consistent with the script-src 'self' CSP.
```

---

## Phase 5: CI/CD & Infrastructure

### Task 15: Add permissions blocks to GitHub Actions (H6)

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

**Step 1: Add permissions to ci.yml**

After `cancel-in-progress: true` and before `jobs:`, add:

```yaml
permissions:
  contents: read
```

**Step 2: Add permissions to deploy.yml**

Same location:

```yaml
permissions:
  contents: read
```

**Step 3: Commit**

```
fix: add least-privilege permissions to GitHub Actions workflows

Restricts default GITHUB_TOKEN scope to read-only. Reduces supply
chain attack surface if any third-party action is compromised.
```

---

### Task 16: Pin GitHub Actions to commit SHAs (M13)

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

**Step 1: Look up current SHAs for each action**

Use `gh` CLI or web to find the commit SHAs for:
- `actions/checkout@v4`
- `oven-sh/setup-bun@v2`
- `cloudflare/wrangler-action@v3`

**Step 2: Replace version tags with SHAs in both files**

Example (SHAs should be verified at implementation time):
```yaml
- uses: actions/checkout@<sha> # v4
- uses: oven-sh/setup-bun@<sha> # v2
- uses: cloudflare/wrangler-action@<sha> # v3
```

**Step 3: Commit**

```
fix: pin GitHub Actions to immutable commit SHAs

Prevents supply chain attacks via compromised mutable version tags.
```

---

### Task 17: Expand .gitignore for .env variants (M12)

**Files:**
- Modify: `.gitignore`

**Step 1: Replace `.env` line with comprehensive patterns**

```
.env
.env.*
!.env.example
**/.env
**/.env.*
!**/.env.example
```

**Step 2: Commit**

```
fix: expand .gitignore to cover .env.local, .env.production, etc.

Prevents accidental commit of environment files with secrets.
```

---

## Verification

After all tasks, run the full verification checklist:

```bash
cd frontend && bun run build        # Zero errors
cd frontend && bun run test:run     # All pass
cd frontend && bun run lint         # No errors
cd backend && bunx tsc --noEmit     # Zero errors
cd collab-server && bun run test    # All pass
```
