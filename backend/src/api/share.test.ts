import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { handleShare, handleResolveShare } from "./share";
import type { Env } from "../env";

const FRONTEND_URL = "http://localhost:5173";
const WS_ID = "test-workspace-1";

// In-memory store to simulate Supabase share_link table
let rows: Array<{ code: string; workspace_id: string; access: string }>;

function createMockSupabase() {
  return {
    from(_table: string) {
      return {
        insert(row: { code: string; workspace_id: string; access: string }) {
          const duplicate = rows.find((r) => r.code === row.code);
          if (duplicate) {
            return Promise.resolve({ error: { code: "23505", message: "duplicate" } });
          }
          rows.push(row);
          return Promise.resolve({ error: null });
        },
        select(_cols: string) {
          return {
            eq(column: string, value: string) {
              return {
                single() {
                  const found = rows.find((r) => (r as Record<string, string>)[column] === value);
                  return Promise.resolve({ data: found ?? null });
                },
              };
            },
          };
        },
      };
    },
  } as any;
}

const ENV_BINDINGS = { FRONTEND_URL } as Env["Bindings"];

function createApp() {
  const app = new Hono<Env>();

  // Middleware that provides supabase via context variables
  app.use("*", async (c, next) => {
    c.set("supabase", createMockSupabase());
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
    rows = [];
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
      expect(body.code).toHaveLength(6);
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
      expect(body.code).toHaveLength(6);
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
  });

  describe("GET /s/:code — share link resolution", () => {
    it("redirects to workspace for valid edit share code", async () => {
      rows.push({ code: "ABC123", workspace_id: WS_ID, access: "edit" });

      const res = await request(app, "/s/ABC123", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${FRONTEND_URL}/#/${WS_ID}`);
    });

    it("redirects with readonly param for readonly share code", async () => {
      rows.push({ code: "RDO456", workspace_id: WS_ID, access: "readonly" });

      const res = await request(app, "/s/RDO456", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(`${FRONTEND_URL}/#/${WS_ID}?access=readonly`);
    });

    it("redirects to frontend root for unknown code", async () => {
      const res = await request(app, "/s/ZZZZZZ", { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(FRONTEND_URL);
    });
  });
});
