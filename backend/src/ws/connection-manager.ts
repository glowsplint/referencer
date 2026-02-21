import type { WSContext } from "hono/ws";

export class ConnectionManager {
  // workspace_id -> client_id -> WSContext
  private connections = new Map<string, Map<string, WSContext>>();

  connect(workspaceId: string, ws: WSContext): string {
    const clientId = crypto.randomUUID();
    if (!this.connections.has(workspaceId)) {
      this.connections.set(workspaceId, new Map());
    }
    this.connections.get(workspaceId)!.set(clientId, ws);
    return clientId;
  }

  disconnect(workspaceId: string, clientId: string): void {
    const clients = this.connections.get(workspaceId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.connections.delete(workspaceId);
      }
    }
  }

  sendTo(workspaceId: string, clientId: string, msg: unknown): void {
    const clients = this.connections.get(workspaceId);
    const ws = clients?.get(clientId);
    if (!ws) return;
    ws.send(JSON.stringify(msg));
  }

  broadcast(
    workspaceId: string,
    msg: unknown,
    excludeClientId: string,
  ): void {
    const clients = this.connections.get(workspaceId);
    if (!clients) return;
    const data = JSON.stringify(msg);
    for (const [clientId, ws] of clients) {
      if (clientId !== excludeClientId) {
        try {
          ws.send(data);
        } catch (err) {
          console.error(`failed to send to client ${clientId}:`, err);
        }
      }
    }
  }
}
