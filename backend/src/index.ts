import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { serveStatic } from "hono/bun";
import { join } from "path";

import { openDatabase } from "./db/database";
import { ConnectionManager } from "./ws/connection-manager";
import {
  handleWebSocketConnection,
  handleWebSocketMessage,
  handleWebSocketClose,
} from "./ws/handler";
import { handleShare, handleResolveShare } from "./api/share";
import { loadAuthConfig } from "./auth/config";
import { initProviders } from "./auth/providers";
import { createAuthRoutes } from "./auth/handlers";
import { optionalAuth } from "./auth/middleware";
import { cleanExpiredSessions } from "./auth/store";

const dbPath = process.env.DB_PATH ?? join(import.meta.dir, "..", "data", "referencer.db");
const db = openDatabase(dbPath);
const connMgr = new ConnectionManager();
const authConfig = loadAuthConfig();
initProviders(authConfig);

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

// CORS
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
  }),
);

// Auth middleware on all routes.
app.use("*", optionalAuth(db, authConfig));

// Auth routes.
app.route("/auth", createAuthRoutes(db, authConfig));

// Share API.
app.post("/api/share", handleShare(db));

// Share link resolution.
const staticDir = join(import.meta.dir, "..", "..", "frontend", "dist");
app.get("/s/:code", handleResolveShare(db, staticDir));

// WebSocket.
app.get(
  "/ws/:workspaceId",
  upgradeWebSocket((c) => {
    const workspaceId = c.req.param("workspaceId");
    let clientId: string | undefined;

    return {
      onOpen(_evt, ws) {
        if (!workspaceId) {
          ws.close(1008, "workspace ID required");
          return;
        }
        const result = handleWebSocketConnection(ws, workspaceId, db, connMgr);
        clientId = result.clientId;
      },
      onMessage(evt, ws) {
        if (!workspaceId || !clientId) return;
        const data =
          typeof evt.data === "string" ? evt.data : evt.data.toString();
        handleWebSocketMessage(ws, workspaceId, clientId, data, db, connMgr);
      },
      onClose() {
        if (workspaceId && clientId) {
          handleWebSocketClose(workspaceId, clientId, connMgr);
        }
      },
    };
  }),
);

// Static file serving for the frontend dist.
app.use(
  "/referencer/*",
  serveStatic({
    root: staticDir,
    rewriteRequestPath: (path) => path.replace(/^\/referencer/, ""),
  }),
);

// SPA fallback: serve index.html for unmatched routes.
app.get("*", async (c) => {
  const html = await Bun.file(join(staticDir, "index.html")).text();
  return c.html(html);
});

// Clean expired sessions periodically (every hour).
setInterval(() => cleanExpiredSessions(db), 60 * 60 * 1000);

const port = Number(process.env.PORT ?? 5000);
console.log(`Server starting on port ${port}`);

export default {
  fetch: app.fetch,
  websocket,
  port,
};
