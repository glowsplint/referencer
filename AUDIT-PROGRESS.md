# Audit & Improvement Implementation Progress

> Auto-generated tracking document. Updated as each item is verified.

## Sprint 1 — Quick Security Wins (Effort: S)

- [x] **S1** Collab server CORS: default to production URL, validate Origin on WS upgrade
- [x] **S2** Yjs write-path sanitization: DOMPurify.sanitize() before storing annotations
- [x] **S3** Link URL sanitization: sanitizeUrl() before setLink
- [x] **S4** Commit lockfile: remove bun.lockb from .gitignore
- [x] **S8** CSP meta tag in frontend/index.html
- [x] **S11** CSRF header: add X-Requested-With to api-client
- [x] **S12** Share code regex: constrain to alphanumeric
- [x] **S13** Image size limit in MiniCommentEditor + username length cap

## Sprint 2 — Quick UX Wins (Effort: S)

- [x] **U1** Status bar default ON for new users _(already correct — default is true)_
- [x] **U2** Rename Lock → Annotate Mode (labels, tooltips)
- [x] **U3** Undo toast on annotation deletion via blur
- [x] **U4** Free Tab key — use [ ] for layer cycling
- [x] **U6** Settings accessible from hub page
- [x] **U11** Tour: don't auto-start for non-English; don't mark complete on read-only skip
- [x] **U14** Color picker: show current color indicator
- [x] **U20** Home button breadcrumb / label in TitleBar
- [x] **U21** Focus-visible on hub card menu buttons

## Sprint 3 — Medium Security Fixes

- [x] **S5** KV rate limiter: documented race condition, recommended alternatives
- [x] **S6** Workspace cascade delete: owner delete removes workspace + share links + Yjs docs
- [x] **S7** Rate limit CRUD endpoints (60 req/min per user on workspaces + folders)
- [x] **S9** Least privilege: documented restricted Supabase role recommendation
- [x] **S10** Periodic WS permission re-validation in Durable Object (5-min alarm)

## Sprint 4 — Medium UX Features

- [x] **U5** Collapsed annotation cards: show truncated text
- [x] **U7** Hub search: client-side filter input
- [x] **U8** Guest data loss warning banner
- [x] **U9** Hub onboarding / empty state illustration
- [x] **U10** Hub i18n: translate all hub strings (31 locales, 50 keys each)
- [x] **U12** One-click annotation: apply highlight/underline on mouseup

## Sprint 5 — Larger UX Features

- [x] **U15** Resizable annotation panel (drag divider, 160–400px range, localStorage persist)
- [x] **U18** Share link UX: full URL display + revoke confirm dialog + expiry dropdown
- [x] **U19** Workspace switcher dropdown in TitleBar (authenticated users only)
- [x] **U22** Mobile read-only annotation panel (bottom drawer with FAB toggle)

## Verification Log

| Item      | Build    | Tests         | Lint         | Visual | Notes                                                                        |
| --------- | -------- | ------------- | ------------ | ------ | ---------------------------------------------------------------------------- |
| Sprint 1  | PASS     | 1748/1748     | 0 errors     | N/A    | Build clean, all tests pass, lint clean                                      |
| Sprint 2  | PASS     | 1747/1747     | 0 errors     | N/A    | 7 test fixes needed (Tab→brackets, lock→annotate), then all pass             |
| Sprint 3  | PASS     | 1747/1747     | 0 errors     | N/A    | Backend+collab tsc clean, frontend regression clean                          |
| Sprint 4  | PASS     | 1760/1760     | 0 errors     | N/A    | 3 parallel agents, all tests pass on combined changes                        |
| Sprint 5  | PASS     | 1763/1763     | 0 errors     | N/A    | 3 parallel agents, all tests pass on combined changes                        |
| **Final** | **PASS** | **1765/1765** | **0 errors** | N/A    | All 5 sprints combined, backend+collab tsc clean, 35 files, +1289/-227 lines |
