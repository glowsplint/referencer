import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

/** Helper: build a Yjs sync message (SyncStep1, SyncStep2, or Update) */
function buildSyncMessage(
  syncType: number,
  payload: Uint8Array,
): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MSG_SYNC);
  encoding.writeVarUint(encoder, syncType);
  encoding.writeVarUint8Array(encoder, payload);
  return encoding.toUint8Array(encoder);
}

/** Helper: build a Yjs awareness message */
function buildAwarenessMessage(payload: Uint8Array): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MSG_AWARENESS);
  encoding.writeVarUint8Array(encoder, payload);
  return encoding.toUint8Array(encoder);
}

/** Helper: create a Y.Doc update that inserts text */
function createDocUpdate(): Uint8Array {
  const doc = new Y.Doc();
  const text = doc.getText("test");
  text.insert(0, "hello from client");
  const update = Y.encodeStateAsUpdate(doc);
  doc.destroy();
  return update;
}

/** Helper: open a WebSocket to the DO with a given role */
async function connectWithRole(
  stub: DurableObjectStub,
  roomName: string,
  role: string,
): Promise<{ ws: WebSocket; messages: ArrayBuffer[] }> {
  const resp = await stub.fetch(
    `http://fake-host/${roomName}?role=${role}`,
    { headers: { Upgrade: "websocket" } },
  );
  const ws = resp.webSocket!;
  ws.accept();

  const messages: ArrayBuffer[] = [];
  ws.addEventListener("message", (e) => {
    if (e.data instanceof ArrayBuffer) {
      messages.push(e.data);
    }
  });

  // Drain the initial SyncStep1 from the server
  await new Promise((r) => setTimeout(r, 50));

  return { ws, messages };
}

describe("YjsRoom read-only enforcement", () => {
  it("accepts updates from an editor-role WebSocket", async () => {
    const id = env.YJS_ROOM.idFromName("test-editor-writes");
    const stub = env.YJS_ROOM.get(id);

    const { ws } = await connectWithRole(stub, "test-editor-writes", "editor");

    // Send a Yjs update
    const update = createDocUpdate();
    const msg = buildSyncMessage(syncProtocol.messageYjsUpdate, update);
    ws.send(msg);

    // Give the DO time to process
    await new Promise((r) => setTimeout(r, 100));

    // Connect a second editor to read back the state
    const { ws: ws2, messages } = await connectWithRole(
      stub,
      "test-editor-writes",
      "editor",
    );

    // The server sends SyncStep1; reply with our empty state vector to get SyncStep2
    const emptyDoc = new Y.Doc();
    const sv = Y.encodeStateVector(emptyDoc);
    emptyDoc.destroy();
    const syncStep1Msg = buildSyncMessage(syncProtocol.messageYjsSyncStep1, sv);
    ws2.send(syncStep1Msg);

    await new Promise((r) => setTimeout(r, 100));

    // Parse the SyncStep2 response to reconstruct the doc
    const receivedDoc = new Y.Doc();
    for (const raw of messages) {
      const data = new Uint8Array(raw);
      const decoder = decoding.createDecoder(data);
      const msgType = decoding.readVarUint(decoder);
      if (msgType !== MSG_SYNC) continue;
      const syncType = decoding.readVarUint(decoder);
      if (
        syncType === syncProtocol.messageYjsSyncStep2 ||
        syncType === syncProtocol.messageYjsUpdate
      ) {
        const u = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(receivedDoc, u);
      }
    }

    expect(receivedDoc.getText("test").toString()).toBe("hello from client");
    receivedDoc.destroy();

    ws.close();
    ws2.close();
  });

  it("silently drops updates from a viewer-role WebSocket", async () => {
    const id = env.YJS_ROOM.idFromName("test-viewer-blocked");
    const stub = env.YJS_ROOM.get(id);

    const { ws: viewerWs } = await connectWithRole(
      stub,
      "test-viewer-blocked",
      "viewer",
    );

    // Send a Yjs update as a viewer — should be silently dropped
    const update = createDocUpdate();
    const msg = buildSyncMessage(syncProtocol.messageYjsUpdate, update);
    viewerWs.send(msg);

    await new Promise((r) => setTimeout(r, 100));

    // Connect an editor to verify the viewer's update was NOT applied
    const { ws: editorWs, messages } = await connectWithRole(
      stub,
      "test-viewer-blocked",
      "editor",
    );

    const emptyDoc = new Y.Doc();
    const sv = Y.encodeStateVector(emptyDoc);
    emptyDoc.destroy();
    const syncStep1Msg = buildSyncMessage(syncProtocol.messageYjsSyncStep1, sv);
    editorWs.send(syncStep1Msg);

    await new Promise((r) => setTimeout(r, 100));

    // Parse responses — doc should be empty
    const receivedDoc = new Y.Doc();
    for (const raw of messages) {
      const data = new Uint8Array(raw);
      const decoder = decoding.createDecoder(data);
      const msgType = decoding.readVarUint(decoder);
      if (msgType !== MSG_SYNC) continue;
      const syncType = decoding.readVarUint(decoder);
      if (
        syncType === syncProtocol.messageYjsSyncStep2 ||
        syncType === syncProtocol.messageYjsUpdate
      ) {
        const u = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(receivedDoc, u);
      }
    }

    expect(receivedDoc.getText("test").toString()).toBe("");
    receivedDoc.destroy();

    viewerWs.close();
    editorWs.close();
  });

  it("drops SyncStep2 from a viewer-role WebSocket", async () => {
    const id = env.YJS_ROOM.idFromName("test-viewer-sync2");
    const stub = env.YJS_ROOM.get(id);

    const { ws: viewerWs } = await connectWithRole(
      stub,
      "test-viewer-sync2",
      "viewer",
    );

    // Send a SyncStep2 as a viewer — should be silently dropped
    const update = createDocUpdate();
    const msg = buildSyncMessage(syncProtocol.messageYjsSyncStep2, update);
    viewerWs.send(msg);

    await new Promise((r) => setTimeout(r, 100));

    // Connect an editor to verify
    const { ws: editorWs, messages } = await connectWithRole(
      stub,
      "test-viewer-sync2",
      "editor",
    );

    const emptyDoc = new Y.Doc();
    const sv = Y.encodeStateVector(emptyDoc);
    emptyDoc.destroy();
    const syncStep1Msg = buildSyncMessage(syncProtocol.messageYjsSyncStep1, sv);
    editorWs.send(syncStep1Msg);

    await new Promise((r) => setTimeout(r, 100));

    const receivedDoc = new Y.Doc();
    for (const raw of messages) {
      const data = new Uint8Array(raw);
      const decoder = decoding.createDecoder(data);
      const msgType = decoding.readVarUint(decoder);
      if (msgType !== MSG_SYNC) continue;
      const syncType = decoding.readVarUint(decoder);
      if (
        syncType === syncProtocol.messageYjsSyncStep2 ||
        syncType === syncProtocol.messageYjsUpdate
      ) {
        const u = decoding.readVarUint8Array(decoder);
        Y.applyUpdate(receivedDoc, u);
      }
    }

    expect(receivedDoc.getText("test").toString()).toBe("");
    receivedDoc.destroy();

    viewerWs.close();
    editorWs.close();
  });

  it("allows awareness messages from viewers", async () => {
    const id = env.YJS_ROOM.idFromName("test-viewer-awareness");
    const stub = env.YJS_ROOM.get(id);

    // Connect an editor first
    const { ws: editorWs, messages: editorMessages } = await connectWithRole(
      stub,
      "test-viewer-awareness",
      "editor",
    );

    // Connect a viewer
    const { ws: viewerWs } = await connectWithRole(
      stub,
      "test-viewer-awareness",
      "viewer",
    );

    // Create a valid awareness update using a real Awareness instance
    const viewerDoc = new Y.Doc();
    const viewerAwareness = new awarenessProtocol.Awareness(viewerDoc);
    viewerAwareness.setLocalState({ cursor: { x: 10, y: 20 } });
    const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
      viewerAwareness,
      [viewerDoc.clientID],
    );
    const awarenessMsg = buildAwarenessMessage(awarenessUpdate);
    viewerWs.send(awarenessMsg);

    await new Promise((r) => setTimeout(r, 100));

    // Check that the editor received an awareness message
    const awarenessReceived = editorMessages.some((raw) => {
      const data = new Uint8Array(raw);
      const decoder = decoding.createDecoder(data);
      const msgType = decoding.readVarUint(decoder);
      return msgType === MSG_AWARENESS;
    });

    expect(awarenessReceived).toBe(true);

    viewerAwareness.destroy();
    viewerDoc.destroy();
    viewerWs.close();
    editorWs.close();
  });
});
