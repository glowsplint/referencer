import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  createShareLink,
  resolveShareLink,
  listShareLinks,
  deleteShareLink,
} from "./share-queries";

// In-memory store to simulate Supabase table
let rows: Array<{
  code: string;
  workspace_id: string;
  access: string;
  expires_at?: string;
  created_by?: string | null;
}>;

function createMockSupabase() {
  return {
    from(_table: string) {
      return {
        insert(row: {
          code: string;
          workspace_id: string;
          access: string;
          expires_at?: string;
          created_by?: string | null;
        }) {
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
              const filtered = rows.filter((r) => (r as Record<string, any>)[column] === value);
              return {
                single() {
                  const found = filtered[0] ?? null;
                  return Promise.resolve({ data: found });
                },
                // For listShareLinks: .select().eq() returns array
                then(resolve: (v: any) => void) {
                  resolve({ data: filtered });
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(column: string, value: string) {
              return {
                eq(column2: string, value2: string) {
                  return {
                    select(_cols: string) {
                      const idx = rows.findIndex(
                        (r) =>
                          (r as Record<string, any>)[column] === value &&
                          (r as Record<string, any>)[column2] === value2,
                      );
                      if (idx >= 0) {
                        const [removed] = rows.splice(idx, 1);
                        return Promise.resolve({ data: [removed] });
                      }
                      return Promise.resolve({ data: [] });
                    },
                  };
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

    it("stores created_by when provided", async () => {
      const code = await createShareLink(supabase, "ws-1", "edit", "user-123");
      const row = rows.find((r) => r.code === code);
      expect(row).toBeDefined();
      expect(row!.created_by).toBe("user-123");
    });

    it("stores created_by as null when not provided", async () => {
      const code = await createShareLink(supabase, "ws-1", "edit");
      const row = rows.find((r) => r.code === code);
      expect(row).toBeDefined();
      expect(row!.created_by).toBeNull();
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

  describe("listShareLinks", () => {
    it("returns active links for a workspace", async () => {
      await createShareLink(supabase, "ws-1", "edit");
      await createShareLink(supabase, "ws-1", "readonly");

      const links = await listShareLinks(supabase, "ws-1");
      expect(links).toHaveLength(2);
      expect(links[0].access).toBe("edit");
      expect(links[1].access).toBe("readonly");
    });

    it("filters out expired links", async () => {
      // Manually insert an expired link
      rows.push({
        code: "EXPIRED1",
        workspace_id: "ws-1",
        access: "edit",
        expires_at: new Date(Date.now() - 1000).toISOString(),
        created_by: null,
      });
      // Insert a valid link
      await createShareLink(supabase, "ws-1", "edit");

      const links = await listShareLinks(supabase, "ws-1");
      expect(links).toHaveLength(1);
      expect(links[0].code).not.toBe("EXPIRED1");
    });

    it("returns empty array when no links exist", async () => {
      const links = await listShareLinks(supabase, "ws-nonexistent");
      expect(links).toHaveLength(0);
    });

    it("maps fields correctly", async () => {
      rows.push({
        code: "TESTCODE",
        workspace_id: "ws-1",
        access: "edit",
        expires_at: "2099-01-01T00:00:00.000Z",
        created_by: "user-123",
      });

      const links = await listShareLinks(supabase, "ws-1");
      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        code: "TESTCODE",
        access: "edit",
        createdAt: undefined, // no created_at in mock row
        expiresAt: "2099-01-01T00:00:00.000Z",
        createdBy: "user-123",
      });
    });
  });

  describe("deleteShareLink", () => {
    it("deletes an existing link and returns true", async () => {
      const code = await createShareLink(supabase, "ws-1", "edit");
      const result = await deleteShareLink(supabase, code, "ws-1");
      expect(result).toBe(true);
      // Verify the link is gone
      expect(rows.find((r) => r.code === code)).toBeUndefined();
    });

    it("returns false for non-existent link", async () => {
      const result = await deleteShareLink(supabase, "NONEXIST", "ws-1");
      expect(result).toBe(false);
    });

    it("returns false when code exists but workspace does not match", async () => {
      const code = await createShareLink(supabase, "ws-1", "edit");
      const result = await deleteShareLink(supabase, code, "ws-other");
      expect(result).toBe(false);
    });
  });
});
