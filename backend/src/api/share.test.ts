import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { handleShare, handleResolveShare, handleAcceptShare } from "./share";
import type { Env } from "../env";

const FRONTEND_URL = "http://localhost:5173";
const WS_ID = "test-workspace-1";
const USER_ID = "test-user-1";

// In-memory stores to simulate Supabase tables
let shareRows: Array<{ code: string; workspace_id: string; access: string }>;
let permissionRows: Array<{ workspace_id: string; user_id: string; role: string }>;
let userWorkspaceRows: Array<{ user_id: string; workspace_id: string; title: string }>;
let workspaceRows: Array<{ id: string }>;

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
            workspaceRows.push(row);
            return Promise.resolve({ error: null });
          },
          upsert(row: { id: string }) {
            if (!workspaceRows.find((r) => r.id === row.id)) {
              workspaceRows.push(row);
            }
            return Promise.resolve({ error: null });
          },
          select(_cols: string) {
            return {
              eq(column: string, value: string) {
                return {
                  single() {
                    const found = workspaceRows.find(
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
      return {};
    },
  } as any;
}

const ENV_BINDINGS = { FRONTEND_URL } as Env["Bindings"];

function createApp(withUser = true) {
  const app = new Hono<Env>();

  // Middleware that provides supabase, logger, and user via context variables
  app.use("*", async (c, next) => {
    c.set("supabase", createMockSupabase());
    c.set("logger", { info: () => {}, error: () => {}, warn: () => {} });
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
  app.post("/api/share/accept", handleAcceptShare());
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
    workspaceRows = [];
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
    it("redirects to frontend share page for any code", async () => {
      const res = await request(app, "/s/ABC123", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${FRONTEND_URL}/#/share/ABC123`);
    });

    it("redirects to frontend share page for unknown code too", async () => {
      const res = await request(app, "/s/ZZZZZZ", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${FRONTEND_URL}/#/share/ZZZZZZ`);
    });
  });

  describe("POST /api/share/accept", () => {
    it("resolves share and returns workspaceId", async () => {
      shareRows.push({ code: "ACC123", workspace_id: WS_ID, access: "edit" });

      const res = await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "ACC123" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.workspaceId).toBe(WS_ID);
    });

    it("grants editor permission for edit share", async () => {
      shareRows.push({ code: "EDT001", workspace_id: WS_ID, access: "edit" });
      // Remove the owner permission so we can verify the share sets editor
      permissionRows.length = 0;

      await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "EDT001" }),
      });

      const perm = permissionRows.find((r) => r.workspace_id === WS_ID && r.user_id === USER_ID);
      expect(perm).toBeDefined();
      expect(perm!.role).toBe("editor");
    });

    it("grants viewer permission for readonly share", async () => {
      shareRows.push({ code: "RDO001", workspace_id: WS_ID, access: "readonly" });
      permissionRows.length = 0;

      await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "RDO001" }),
      });

      const perm = permissionRows.find((r) => r.workspace_id === WS_ID && r.user_id === USER_ID);
      expect(perm).toBeDefined();
      expect(perm!.role).toBe("viewer");
    });

    it("does not downgrade existing higher permission", async () => {
      shareRows.push({ code: "RDO002", workspace_id: WS_ID, access: "readonly" });
      // User already has owner permission
      expect(permissionRows[0].role).toBe("owner");

      await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "RDO002" }),
      });

      const perm = permissionRows.find((r) => r.workspace_id === WS_ID && r.user_id === USER_ID);
      expect(perm!.role).toBe("owner");
    });

    it("returns 404 for unknown share code", async () => {
      const res = await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "NONEXIST" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 400 when code is missing", async () => {
      const res = await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it("returns 401 when user is not authenticated", async () => {
      const noAuthApp = createApp(false);
      shareRows.push({ code: "ACC401", workspace_id: WS_ID, access: "edit" });

      const res = await request(noAuthApp, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "ACC401" }),
      });

      expect(res.status).toBe(401);
    });

    it("adds workspace to user hub", async () => {
      shareRows.push({ code: "HUB001", workspace_id: WS_ID, access: "edit" });
      permissionRows.length = 0;

      await request(app, "/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "HUB001" }),
      });

      const uw = userWorkspaceRows.find((r) => r.workspace_id === WS_ID && r.user_id === USER_ID);
      expect(uw).toBeDefined();
    });
  });
});
