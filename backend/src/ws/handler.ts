import type { Database } from "bun:sqlite";
import type { WSContext } from "hono/ws";
import type { ClientMessage, ServerMessage } from "../types";
import { ensureWorkspace, getWorkspaceState } from "../db/workspace-queries";
import { ConnectionManager } from "./connection-manager";
import { actionHandlers } from "./actions";

export function handleWebSocketConnection(
  ws: WSContext,
  workspaceId: string,
  db: Database,
  connMgr: ConnectionManager,
): { clientId: string } {
  const clientId = connMgr.connect(workspaceId, ws);
  console.log(`client ${clientId} connected to workspace ${workspaceId}`);

  // Ensure workspace exists and send initial state.
  ensureWorkspace(db, workspaceId);
  const state = getWorkspaceState(db, workspaceId);

  // Send state as a flattened payload (WorkspaceState fields become the payload map).
  const statePayload = state as unknown as Record<string, unknown>;
  const stateMsg: ServerMessage = {
    type: "state",
    payload: statePayload,
  };
  connMgr.sendTo(workspaceId, clientId, stateMsg);

  return { clientId };
}

export function handleWebSocketMessage(
  ws: WSContext,
  workspaceId: string,
  clientId: string,
  data: string,
  db: Database,
  connMgr: ConnectionManager,
): void {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(data);
  } catch {
    console.error(`invalid message from client ${clientId}`);
    return;
  }

  const handler = actionHandlers[msg.type];
  if (!handler) {
    connMgr.sendTo(workspaceId, clientId, {
      type: "error",
      payload: { message: `Unknown action: ${msg.type}` },
      requestId: msg.requestId,
    } satisfies ServerMessage);
    return;
  }

  try {
    handler(db, workspaceId, msg.payload);
  } catch (err) {
    console.error(`action ${msg.type} error:`, err);
    connMgr.sendTo(workspaceId, clientId, {
      type: "error",
      payload: {
        message: err instanceof Error ? err.message : String(err),
      },
      requestId: msg.requestId,
    } satisfies ServerMessage);
    return;
  }

  // Ack to sender.
  connMgr.sendTo(workspaceId, clientId, {
    type: "ack",
    payload: {},
    requestId: msg.requestId,
  } satisfies ServerMessage);

  // Broadcast to other clients.
  // Flatten actionType into the original payload, matching Go behavior.
  const broadcastPayload: Record<string, unknown> = {
    actionType: msg.type,
    ...msg.payload,
  };
  connMgr.broadcast(
    workspaceId,
    {
      type: "action",
      payload: broadcastPayload,
      sourceClientId: clientId,
      requestId: msg.requestId,
    } satisfies ServerMessage,
    clientId,
  );
}

export function handleWebSocketClose(
  workspaceId: string,
  clientId: string,
  connMgr: ConnectionManager,
): void {
  connMgr.disconnect(workspaceId, clientId);
  console.log(`client ${clientId} disconnected from workspace ${workspaceId}`);
}
