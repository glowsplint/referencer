import { DurableObject } from "cloudflare:workers";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { loadSnapshot, saveSnapshot } from "./persistence";

// Message types matching y-websocket v3
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;
const MSG_QUERY_AWARENESS = 3;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export class YjsRoom extends DurableObject<Env> {
  private doc: Y.Doc | null = null;
  private awareness: awarenessProtocol.Awareness | null = null;
  private roomName: string | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    // Room name is the first path segment
    const roomName = url.pathname.slice(1).split("?")[0];

    // Handle WebSocket upgrade
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Tag WebSocket with user's role for server-side write enforcement
    const role = url.searchParams.get("role") ?? "viewer";
    this.ctx.acceptWebSocket(server, [`role:${role}`]);

    // Store room name for persistence
    if (!this.roomName) {
      this.roomName = roomName;
      await this.ctx.storage.put("room-name", roomName);
    }

    // Initialize doc if needed
    if (!this.doc) {
      await this.initDoc();
    }

    // Send sync step 1 to new client (server's state vector).
    // The y-websocket v3 client sends SyncStep1 on connect, but the
    // client-server model also has the server send SyncStep1 so the client
    // can reply with SyncStep2 containing its local updates.
    this.sendSyncStep1(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private async initDoc(): Promise<void> {
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    // Load room name if not set
    if (!this.roomName) {
      this.roomName = (await this.ctx.storage.get<string>("room-name")) || "default";
    }

    // Try to load from DO storage first (primary)
    const stored = await this.ctx.storage.get<ArrayBuffer>("yjs-state");
    if (stored) {
      Y.applyUpdate(this.doc, new Uint8Array(stored));
    } else {
      // Fallback to Supabase
      try {
        const snapshot = await loadSnapshot(
          this.env.SUPABASE_URL,
          this.env.SUPABASE_SERVICE_KEY,
          this.roomName,
        );
        if (snapshot) {
          Y.applyUpdate(this.doc, snapshot);
        }
      } catch (err) {
        console.error(
          `[collab-do] failed to load snapshot from Supabase for ${this.roomName}:`,
          err,
        );
      }
    }

    // Set alarm for periodic snapshots to Supabase
    const alarm = await this.ctx.storage.getAlarm();
    if (!alarm) {
      await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);
    }
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): Promise<void> {
    if (typeof message === "string") return;
    const data = new Uint8Array(message);
    if (data.length === 0) return;

    if (!this.doc) {
      await this.initDoc();
    }

    // Decode using lib0 -- messages use variable-length integer encoding
    const decoder = decoding.createDecoder(data);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MSG_SYNC) {
      this.handleSyncMessage(ws, decoder, data);
    } else if (messageType === MSG_AWARENESS) {
      this.handleAwarenessMessage(ws, decoder, data);
    } else if (messageType === MSG_QUERY_AWARENESS) {
      this.handleQueryAwareness(ws);
    }
  }

  private isReadOnly(ws: WebSocket): boolean {
    return this.ctx.getTags(ws).includes("role:viewer");
  }

  private handleSyncMessage(
    ws: WebSocket,
    decoder: decoding.Decoder,
    rawMessage: Uint8Array,
  ): void {
    if (!this.doc) return;

    const syncType = decoding.readVarUint(decoder);

    if (syncType === syncProtocol.messageYjsSyncStep1) {
      // Client sent its state vector. Respond with:
      // 1. SyncStep2 (missing updates for the client)
      // 2. SyncStep1 (our state vector so client can send us its updates)
      const clientStateVector = decoding.readVarUint8Array(decoder);

      // Send SyncStep2: updates the client is missing
      const step2Encoder = encoding.createEncoder();
      encoding.writeVarUint(step2Encoder, MSG_SYNC);
      syncProtocol.writeSyncStep2(step2Encoder, this.doc, clientStateVector);
      ws.send(encoding.toUint8Array(step2Encoder));

      // Send SyncStep1: our state vector
      const step1Encoder = encoding.createEncoder();
      encoding.writeVarUint(step1Encoder, MSG_SYNC);
      syncProtocol.writeSyncStep1(step1Encoder, this.doc);
      ws.send(encoding.toUint8Array(step1Encoder));
    } else if (syncType === syncProtocol.messageYjsSyncStep2) {
      // Silently drop writes from viewers
      if (this.isReadOnly(ws)) return;

      // Client sent missing updates (response to our SyncStep1)
      const update = decoding.readVarUint8Array(decoder);
      Y.applyUpdate(this.doc, update, ws);
      this.debouncedSaveToStorage();
    } else if (syncType === syncProtocol.messageYjsUpdate) {
      // Silently drop writes from viewers
      if (this.isReadOnly(ws)) return;

      // Client sent a document update -- apply and broadcast
      const update = decoding.readVarUint8Array(decoder);
      Y.applyUpdate(this.doc, update, ws);

      // Broadcast the raw message to all other clients
      this.broadcastExcept(ws, rawMessage);
      this.debouncedSaveToStorage();
    }
  }

  private handleAwarenessMessage(
    ws: WebSocket,
    decoder: decoding.Decoder,
    rawMessage: Uint8Array,
  ): void {
    // Read the awareness data (writeVarUint8Array format)
    const update = decoding.readVarUint8Array(decoder);

    if (this.awareness) {
      awarenessProtocol.applyAwarenessUpdate(this.awareness, update, ws);
    }

    // Broadcast the raw awareness message to all other clients
    this.broadcastExcept(ws, rawMessage);
  }

  private handleQueryAwareness(ws: WebSocket): void {
    if (!this.awareness) return;

    const clients = Array.from(this.awareness.getStates().keys());
    if (clients.length === 0) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, clients),
    );
    ws.send(encoding.toUint8Array(encoder));
  }

  private sendSyncStep1(ws: WebSocket): void {
    if (!this.doc) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    ws.send(encoding.toUint8Array(encoder));
  }

  private broadcastExcept(sender: WebSocket, message: Uint8Array): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== sender) {
        try {
          ws.send(message);
        } catch {
          // Client may have disconnected
        }
      }
    }
  }

  private debouncedSaveToStorage(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToStorage();
    }, 1000);
  }

  private async saveToStorage(): Promise<void> {
    if (!this.doc) return;
    const state = Y.encodeStateAsUpdate(this.doc);
    if (state.byteLength > 128 * 1024) {
      console.warn(
        `[collab-do] State exceeds 128KB (${state.byteLength} bytes), falling back to Supabase for ${this.roomName}`,
      );
      await this.saveToSupabase();
      return;
    }
    await this.ctx.storage.put("yjs-state", state.buffer);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    // Filter out the closing socket when checking remaining connections
    const remaining = this.ctx.getWebSockets().filter((s) => s !== ws);
    if (remaining.length === 0 && this.doc) {
      // Flush any pending debounced save
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      await this.saveToStorage();
      await this.saveToSupabase();
      await this.ctx.storage.deleteAlarm();
      // Clean up to free memory (DO will be evicted after inactivity)
      this.doc.destroy();
      this.doc = null;
      if (this.awareness) {
        this.awareness.destroy();
        this.awareness = null;
      }
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    // Delegate to close handler for cleanup
    await this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    // Periodic snapshot to Supabase
    await this.saveToSupabase();

    // Reset alarm if still active connections
    if (this.ctx.getWebSockets().length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);
    }
  }

  private async saveToSupabase(): Promise<void> {
    if (!this.doc) return;
    if (!this.roomName) {
      this.roomName = (await this.ctx.storage.get<string>("room-name")) || null;
    }
    if (!this.roomName) return;

    try {
      const state = Y.encodeStateAsUpdate(this.doc);
      await saveSnapshot(
        this.env.SUPABASE_URL,
        this.env.SUPABASE_SERVICE_KEY,
        this.roomName,
        state,
      );
    } catch (err) {
      console.error(`[collab-do] failed to save snapshot to Supabase for ${this.roomName}:`, err);
    }
  }
}
