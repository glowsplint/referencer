import { describe, it, expect, beforeEach, mock } from "bun:test";
import { createShareLink, resolveShareLink } from "./share-queries";

// In-memory store to simulate Supabase table
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

describe("share-queries", () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    rows = [];
    supabase = createMockSupabase();
  });

  describe("createShareLink", () => {
    it("generates a 12-character code", async () => {
      const code = await createShareLink(supabase, "ws-1", "edit");
      expect(code).toHaveLength(12);
      expect(typeof code).toBe("string");
    });

    it("creates different codes for multiple calls", async () => {
      const code1 = await createShareLink(supabase, "ws-1", "edit");
      const code2 = await createShareLink(supabase, "ws-1", "readonly");
      expect(code1).not.toBe(code2);
    });
  });

  describe("resolveShareLink", () => {
    it("returns correct workspace and access for valid code", async () => {
      const code = await createShareLink(supabase, "ws-1", "edit");
      const result = await resolveShareLink(supabase, code);
      expect(result).not.toBeNull();
      expect(result!.workspaceId).toBe("ws-1");
      expect(result!.access).toBe("edit");
    });

    it("returns correct access for readonly link", async () => {
      const code = await createShareLink(supabase, "ws-1", "readonly");
      const result = await resolveShareLink(supabase, code);
      expect(result).not.toBeNull();
      expect(result!.access).toBe("readonly");
    });

    it("returns null for unknown code", async () => {
      const result = await resolveShareLink(supabase, "ZZZZZZ");
      expect(result).toBeNull();
    });
  });
});
