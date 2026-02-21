import type { Database } from "bun:sqlite";
import { generateCode } from "../lib/utils";

export function createShareLink(db: Database, workspaceId: string, access: string): string {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const code = generateCode(6);
    try {
      db.run("INSERT INTO share_link (code, workspace_id, access) VALUES (?, ?, ?)", [
        code,
        workspaceId,
        access,
      ]);
      return code;
    } catch {
      // On unique constraint violation, retry.
    }
  }
  throw new Error(`failed to generate unique share code after ${maxRetries} retries`);
}

export function resolveShareLink(
  db: Database,
  code: string,
): { workspaceId: string; access: string } | null {
  const row = db
    .query<
      { workspace_id: string; access: string },
      [string]
    >("SELECT workspace_id, access FROM share_link WHERE code = ?")
    .get(code);

  if (!row) {
    return null;
  }
  return { workspaceId: row.workspace_id, access: row.access };
}
