import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { handleShare, handleResolveShare } from "./share";
import type { Env } from "../env";

const FRONTEND_URL = "http://localhost:5173";
const WS_ID = "test-workspace-1";
const USER_ID = "test-user-1";

// In-memory stores to simulate Supabase tables
let shareRows: Array<{ code: string; workspace_id: string; access: string }>;
let permissionRows: Array<{ workspace_id: string; user_id: string; role: string }>;
let userWorkspaceRows: Array<{ user_id: string; workspace_id: string; title: string }>;

function createMockSupabase() {
  return {
    from(table: string) {
      if (table === "share_link") {
        return {
          insert(row: { code: string; workspace_id: string; access: string }) {
            const duplicate = shareRows.find((r) => r.code === row.code);
            if (duplicate) {
              return Promise.resolve({ error: { code: "23505", message: "duplicate" } });
            }
            shareRows.push(row);
            return Promise.resolve({ error: null });
          },
          select(_cols: string) {
            return {
              eq(column: string, value: string) {
                return {
                  single() {
                    const found = shareRows.find(
                      (r) => (r as Record<string, string>)[column] === value,
                    );
                    return Promise.resolve({ data: found ?? null });
                  },
                };
              },
            };
          },
        };
      }
      if (table === "workspace_permission") {
        return {
          select(_cols: string) {
            return {
              eq(column: string, value: string) {
                return {
                  eq(column2: string, value2: string) {
                    return {
                      single() {
                        const found = permissionRows.find(
                          (r) =>
                            (r as Record<string, string>)[column] === value &&
                            (r as Record<string, string>)[column2] === value2,
                        );
                        return Promise.resolve({ data: found ?? null });
                      },
                    };
                  },
                };
              },
            };
          },
          upsert(row: { workspace_id: string; user_id: string; role: string }) {
            const idx = permissionRows.findIndex(
              (r) => r.workspace_id === row.workspace_id && r.user_id === row.user_id,
            );
            if (idx >= 0) {
              permissionRows[idx] = row;
            } else {
              permissionRows.push(row);
            }
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "user_workspace") {
        return {
          insert(row: { user_id: string; workspace_id: string; title: string }) {
            const duplicate = userWorkspaceRows.find(
              (r) => r.user_id === row.user_id && r.workspace_id === row.workspace_id,
            );
            if (duplicate) {
              return Promise.resolve({ error: { code: "23505", message: "duplicate" } });
            }
            userWorkspaceRows.push(row);
            return Promise.resolve({ error: null });
          },
          upsert(row: { user_id: string; workspace_id: string; title: string }, _opts?: any) {
            const idx = userWorkspaceRows.findIndex(
              (r) => r.user_id === row.user_id && r.workspace_id === row.workspace_id,
            );
            if (idx >= 0) {
              userWorkspaceRows[idx] = { ...userWorkspaceRows[idx], ...row };
            } else {
              userWorkspaceRows.push(row);
            }
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "workspace") {
        return {
          insert(row: { id: string }) {
            return Promise.resolve({ error: null });
          },
          upsert(row: { id: string }) {
            return Promise.resolve({ error: null });
          },
        };
      }
      return {};
    },
  } as any;
}

const ENV_BINDINGS = { FRONTEND_URL } as Env["Bindings"];

function createApp(withUser = true) {
  const app = new Hono<Env>();

  // Middleware that provides supabase and user via context variables
  app.use("*", async (c, next) => {
    c.set("supabase", createMockSupabase());
    if (withUser) {
      c.set("user", {
        id: USER_ID,
        email: "test@test.com",
        name: "Test",
        avatarUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      c.set("user", null);
    }
    await next();
  });

  app.post("/api/share", handleShare());
  app.get("/s/:code", handleResolveShare());

  return app;
}

function request(app: Hono<Env>, path: string, init?: RequestInit) {
  return app.request(path, init, ENV_BINDINGS);
}

describe("share API routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    shareRows = [];
    permissionRows = [];
    userWorkspaceRows = [];
    // Give the test user owner permission by default
    permissionRows.push({ workspace_id: WS_ID, user_id: USER_ID, role: "owner" });
    app = createApp();
  });

  describe("POST /api/share", () => {
    it("creates an edit share link", async () => {
      const res = await request(app, "/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "edit" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBeDefined();
      expect(body.code).toHaveLength(12);
      expect(body.url).toBe(`/s/${body.code}`);
    });

    it("creates a readonly share link", async () => {
      const res = await request(app, "/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "readonly" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toHaveLength(12);
    });

    it("returns 400 for invalid access type", async () => {
      const res = await request(app, "/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "invalid" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("access");
    });

    it("returns 401 when user is not authenticated", async () => {
      const noAuthApp = createApp(false);
      const res = await request(noAuthApp, "/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "edit" }),
      });

      expect(res.status).toBe(401);
    });

    it("returns 403 when user lacks permission", async () => {
      permissionRows.length = 0; // Remove all permissions
      const res = await request(app, "/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: WS_ID, access: "edit" }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /s/:code — share link resolution", () => {
    it("redirects to workspace for valid edit share code", async () => {
      shareRows.push({ code: "ABC123", workspace_id: WS_ID, access: "edit" });

      const res = await request(app, "/s/ABC123", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${FRONTEND_URL}/#/${WS_ID}`);
    });

    it("redirects to workspace without query param for readonly share code", async () => {
      shareRows.push({ code: "RDO456", workspace_id: WS_ID, access: "readonly" });

      const res = await request(app, "/s/RDO456", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${FRONTEND_URL}/#/${WS_ID}`);
    });

    it("redirects to frontend root for unknown code", async () => {
      const res = await request(app, "/s/ZZZZZZ", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(FRONTEND_URL);
    });
  });
});
