import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { search } from "./search";
import type { Env } from "../env";

const USER_ID = "test-user-1";

let rpcResult: { data: any; error: any };

function createMockSupabase() {
  return {
    rpc(name: string, params: any) {
      return Promise.resolve(rpcResult);
    },
    from() {
      return {};
    },
  } as any;
}

function createApp(withUser = true) {
  const app = new Hono<Env>();
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
  app.route("/api/search", search);
  return app;
}

const ENV_BINDINGS = {} as Env["Bindings"];

function request(app: Hono<Env>, path: string) {
  return app.request(path, {}, ENV_BINDINGS);
}

describe("search API", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    rpcResult = { data: [], error: null };
    app = createApp();
  });

  it("returns 401 when not authenticated", async () => {
    const noAuthApp = createApp(false);
    const res = await request(noAuthApp, "/api/search?q=test");
    expect(res.status).toBe(401);
  });

  it("returns 400 for query shorter than 2 chars", async () => {
    const res = await request(app, "/api/search?q=a");
    expect(res.status).toBe(400);
  });

  it("returns 400 for query longer than 200 chars", async () => {
    const longQ = "a".repeat(201);
    const res = await request(app, `/api/search?q=${longQ}`);
    expect(res.status).toBe(400);
  });

  it("returns search results from RPC", async () => {
    rpcResult = {
      data: [
        {
          annotation_id: "ann-1",
          document_id: "doc-1",
          document_title: "Test Doc",
          layer_id: "layer-1",
          layer_name: "Layer 1",
          annotation_type: "highlight",
          selected_text: "hello world",
          annotation_text: "",
          reply_texts: "",
          user_name: "User",
          rank: 1,
          total_count: 1,
        },
      ],
      error: null,
    };
    const res = await request(app, "/api/search?q=hello");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.results[0].total_count).toBeUndefined();
  });

  it("returns 500 on RPC error", async () => {
    rpcResult = { data: null, error: { message: "DB error" } };
    const res = await request(app, "/api/search?q=test");
    expect(res.status).toBe(500);
  });

  it("clamps limit and offset values", async () => {
    rpcResult = { data: [], error: null };
    const res = await request(app, "/api/search?q=test&limit=999&offset=-5");
    expect(res.status).toBe(200);
  });
});
