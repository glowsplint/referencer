import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_PORT = 5050;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const WS_URL = `ws://localhost:${BACKEND_PORT}`;

let serverProcess: ChildProcess;
let dbPath: string;

/**
 * Browser-side WebSocket helper functions injected via eval().
 * Uses a simple counter for requestId since crypto.randomUUID() is
 * unavailable on about:blank (not a secure context).
 */
function wsHelpers() {
  return `
    var __reqCounter = 0;

    function connectWS(url) {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        ws.onopen = () => resolve(ws);
        ws.onerror = () => reject(new Error('WebSocket connection failed'));
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
      });
    }

    function waitForMessage(ws, predicate, timeoutMs) {
      timeoutMs = timeoutMs || 5000;
      return new Promise((resolve, reject) => {
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (predicate(data)) {
            ws.removeEventListener('message', handler);
            resolve(data);
          }
        };
        ws.addEventListener('message', handler);
        setTimeout(() => {
          ws.removeEventListener('message', handler);
          reject(new Error('waitForMessage timeout'));
        }, timeoutMs);
      });
    }

    function sendAndWaitAck(ws, msg, timeoutMs) {
      timeoutMs = timeoutMs || 5000;
      var requestId = 'req-' + (++__reqCounter) + '-' + Date.now();
      var fullMsg = Object.assign({}, msg, { requestId: requestId });
      var ackPromise = waitForMessage(ws, function(d) {
        return d.type === 'ack' && d.requestId === requestId;
      }, timeoutMs);
      ws.send(JSON.stringify(fullMsg));
      return ackPromise;
    }

    function closeWS(ws) {
      return new Promise((resolve) => {
        if (ws.readyState === WebSocket.CLOSED) { resolve(); return; }
        ws.onclose = () => resolve();
        ws.close();
        setTimeout(resolve, 1000);
      });
    }
  `;
}

test.beforeAll(async () => {
  dbPath = `/tmp/test-referencer-${randomUUID()}.db`;

  const serverBin = path.resolve(__dirname, "..", "..", "..", "backend-go", "server");

  serverProcess = spawn(serverBin, [], {
    env: {
      ...process.env,
      DEVELOPMENT_MODE: "1",
      DATABASE_PATH: dbPath,
      PORT: String(BACKEND_PORT),
      CORS_ORIGINS: "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5050",
    },
    stdio: "pipe",
  });

  serverProcess.stderr?.on("data", () => {
    // Uncomment for debugging: console.log('[server]', data.toString());
  });

  // Wait for server to be ready by polling
  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/test`).catch(() => null);
      if (resp) break;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      serverProcess.on("exit", () => resolve());
      setTimeout(resolve, 3000);
    });
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(dbPath + suffix);
    } catch {
      // File may not exist
    }
  }
});

test.describe("Backend Integration", () => {
  test("WebSocket connects and receives initial state", async ({ page }) => {
    const workspaceId = randomUUID();

    const state = await page.evaluate(
      async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        const msg: any = await new Promise((resolve, reject) => {
          ws.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data));
          setTimeout(() => reject(new Error("timeout")), 5000);
        });
        ws.close();
        return msg;
      },
      { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
    );

    expect(state.type).toBe("state");
    expect(state.payload.workspaceId).toBe(workspaceId);
    expect(state.payload.editors).toHaveLength(1);
    expect(state.payload.editors[0].name).toBe("Passage 1");
    expect(state.payload.layers).toHaveLength(0);
  });

  test("Layer CRUD persists across reconnections", async ({ page }) => {
    const workspaceId = randomUUID();
    const layerId = randomUUID();

    // Connect, add layer, disconnect
    await page.evaluate(
      async ({ wsUrl, wid, lid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "addLayer",
          payload: { id: lid, name: "Test Layer", color: "#ff0000" },
        });
        // @ts-ignore
        await closeWS(ws);
      },
      { wsUrl: WS_URL, wid: workspaceId, lid: layerId, h: wsHelpers() }
    );

    // Reconnect and verify layer persisted
    const state = await page.evaluate(
      async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        const state = await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await closeWS(ws);
        return state;
      },
      { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
    );

    expect(state.payload.layers).toHaveLength(1);
    expect(state.payload.layers[0].id).toBe(layerId);
    expect(state.payload.layers[0].name).toBe("Test Layer");
    expect(state.payload.layers[0].color).toBe("#ff0000");
    expect(state.payload.layers[0].visible).toBe(true);
  });

  test("Multi-client real-time sync", async ({ browser }) => {
    const workspaceId = randomUUID();
    const layerId = randomUUID();
    const highlightId = randomUUID();

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Connect both clients sequentially to avoid race conditions
      await pageA.evaluate(async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        (window as any).__ws = ws;
      }, { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() });

      await pageB.evaluate(async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        (window as any).__ws = ws;
      }, { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() });

      // Client A adds layer, Client B receives broadcast
      const [, addLayerMsg] = await Promise.all([
        pageA.evaluate(async ({ lid, h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, {
            type: "addLayer",
            payload: { id: lid, name: "Sync Layer", color: "#00ff00" },
          });
          return true;
        }, { lid: layerId, h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage(
            (window as any).__ws,
            (d: any) => d.type === "action" && d.payload?.actionType === "addLayer",
            10000
          );
        }, { h: wsHelpers() }),
      ]);

      expect(addLayerMsg.type).toBe("action");
      expect(addLayerMsg.payload.actionType).toBe("addLayer");
      expect(addLayerMsg.payload.id).toBe(layerId);
      expect(addLayerMsg.payload.name).toBe("Sync Layer");

      // Client B adds a highlight, Client A should receive it
      const [, highlightBroadcast] = await Promise.all([
        pageB.evaluate(
          async ({ hid, lid, h }) => {
            eval(h);
            // @ts-ignore
            await sendAndWaitAck((window as any).__ws, {
              type: "addHighlight",
              payload: {
                layerId: lid,
                highlight: { id: hid, editorIndex: 0, from: 1, to: 5, text: "test", annotation: "" },
              },
            });
            return true;
          },
          { hid: highlightId, lid: layerId, h: wsHelpers() }
        ),
        pageA.evaluate(
          async ({ h }) => {
            eval(h);
            // @ts-ignore
            return waitForMessage(
              (window as any).__ws,
              (d: any) => d.type === "action" && d.payload?.actionType === "addHighlight",
              10000
            );
          },
          { h: wsHelpers() }
        ),
      ]);

      expect(highlightBroadcast.type).toBe("action");
      expect(highlightBroadcast.payload.actionType).toBe("addHighlight");

      // Clean up
      await pageA.evaluate(async ({ h }) => { eval(h); /* @ts-ignore */ await closeWS((window as any).__ws); }, { h: wsHelpers() });
      await pageB.evaluate(async ({ h }) => { eval(h); /* @ts-ignore */ await closeWS((window as any).__ws); }, { h: wsHelpers() });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("Share link creation and resolution", async ({ page, request }) => {
    const workspaceId = randomUUID();

    // Create workspace via WebSocket first (required for FK constraint)
    await page.evaluate(async ({ wsUrl, wid, h }) => {
      eval(h);
      // @ts-ignore
      const ws = await connectWS(`${wsUrl}/ws/${wid}`);
      // @ts-ignore
      await waitForMessage(ws, (d: any) => d.type === "state");
      // @ts-ignore
      await closeWS(ws);
    }, { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() });

    // Create edit share link
    const editResp = await request.post(`${BACKEND_URL}/api/share`, {
      data: { workspaceId, access: "edit" },
    });
    expect(editResp.ok()).toBeTruthy();

    const editShare = await editResp.json();
    expect(editShare.code).toBeTruthy();
    expect(editShare.url).toBe(`/s/${editShare.code}`);

    // Resolve edit share link
    const editRedirect = await request.get(`${BACKEND_URL}/s/${editShare.code}`, {
      maxRedirects: 0,
    });
    expect(editRedirect.status()).toBe(302);
    expect(editRedirect.headers()["location"]).toBe(`/space/${workspaceId}`);

    // Create readonly share link
    const readonlyResp = await request.post(`${BACKEND_URL}/api/share`, {
      data: { workspaceId, access: "readonly" },
    });
    const readonlyShare = await readonlyResp.json();

    const readonlyRedirect = await request.get(`${BACKEND_URL}/s/${readonlyShare.code}`, {
      maxRedirects: 0,
    });
    expect(readonlyRedirect.status()).toBe(302);
    expect(readonlyRedirect.headers()["location"]).toBe(`/space/${workspaceId}?access=readonly`);
  });

  test("Editor content persistence", async ({ page }) => {
    const workspaceId = randomUUID();
    const contentJson = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
    };

    await page.evaluate(
      async ({ wsUrl, wid, cj, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "updateEditorContent",
          payload: { editorIndex: 0, contentJson: cj },
        });
        // @ts-ignore
        await closeWS(ws);
      },
      { wsUrl: WS_URL, wid: workspaceId, cj: contentJson, h: wsHelpers() }
    );

    const state = await page.evaluate(
      async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        const state = await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await closeWS(ws);
        return state;
      },
      { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
    );

    expect(state.payload.editors[0].contentJson).toEqual(contentJson);
  });

  test("Highlight and arrow persistence", async ({ page }) => {
    const workspaceId = randomUUID();
    const layerId = randomUUID();
    const highlightId = randomUUID();
    const arrowId = randomUUID();

    await page.evaluate(
      async ({ wsUrl, wid, lid, hid, aid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "addLayer",
          payload: { id: lid, name: "Layer 1", color: "#ff0000" },
        });
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "addHighlight",
          payload: {
            layerId: lid,
            highlight: { id: hid, editorIndex: 0, from: 10, to: 20, text: "highlighted text", annotation: "my note" },
          },
        });
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "addArrow",
          payload: {
            layerId: lid,
            arrow: {
              id: aid,
              from: { editorIndex: 0, from: 5, to: 10, text: "start" },
              to: { editorIndex: 0, from: 25, to: 30, text: "end" },
            },
          },
        });
        // @ts-ignore
        await closeWS(ws);
      },
      { wsUrl: WS_URL, wid: workspaceId, lid: layerId, hid: highlightId, aid: arrowId, h: wsHelpers() }
    );

    const state = await page.evaluate(
      async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        const state = await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await closeWS(ws);
        return state;
      },
      { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
    );

    const layer = state.payload.layers[0];
    expect(layer.highlights).toHaveLength(1);
    expect(layer.highlights[0].id).toBe(highlightId);
    expect(layer.highlights[0].from).toBe(10);
    expect(layer.highlights[0].to).toBe(20);
    expect(layer.highlights[0].text).toBe("highlighted text");
    expect(layer.highlights[0].annotation).toBe("my note");

    expect(layer.arrows).toHaveLength(1);
    expect(layer.arrows[0].id).toBe(arrowId);
    expect(layer.arrows[0].from.editorIndex).toBe(0);
    expect(layer.arrows[0].from.from).toBe(5);
    expect(layer.arrows[0].to.to).toBe(30);
  });

  test("Underline persistence", async ({ page }) => {
    const workspaceId = randomUUID();
    const layerId = randomUUID();
    const underlineId = randomUUID();

    await page.evaluate(
      async ({ wsUrl, wid, lid, uid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "addLayer",
          payload: { id: lid, name: "Underline Layer", color: "#0000ff" },
        });
        // @ts-ignore
        await sendAndWaitAck(ws, {
          type: "addUnderline",
          payload: {
            layerId: lid,
            underline: { id: uid, editorIndex: 0, from: 3, to: 8, text: "underlined" },
          },
        });
        // @ts-ignore
        await closeWS(ws);
      },
      { wsUrl: WS_URL, wid: workspaceId, lid: layerId, uid: underlineId, h: wsHelpers() }
    );

    const state = await page.evaluate(
      async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        const state = await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await closeWS(ws);
        return state;
      },
      { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
    );

    const layer = state.payload.layers[0];
    expect(layer.underlines).toHaveLength(1);
    expect(layer.underlines[0].id).toBe(underlineId);
    expect(layer.underlines[0].from).toBe(3);
    expect(layer.underlines[0].to).toBe(8);
    expect(layer.underlines[0].text).toBe("underlined");
  });

  test("Layer operations broadcast correctly", async ({ browser }) => {
    const workspaceId = randomUUID();
    const layerId = randomUUID();

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Client A connects and adds a layer
      await pageA.evaluate(
        async ({ wsUrl, wid, lid, h }) => {
          eval(h);
          // @ts-ignore
          const ws = await connectWS(`${wsUrl}/ws/${wid}`);
          // @ts-ignore
          await waitForMessage(ws, (d: any) => d.type === "state");
          // @ts-ignore
          await sendAndWaitAck(ws, {
            type: "addLayer",
            payload: { id: lid, name: "Broadcast Layer", color: "#ff0000" },
          });
          (window as any).__ws = ws;
        },
        { wsUrl: WS_URL, wid: workspaceId, lid: layerId, h: wsHelpers() }
      );

      // Client B connects
      await pageB.evaluate(
        async ({ wsUrl, wid, h }) => {
          eval(h);
          // @ts-ignore
          const ws = await connectWS(`${wsUrl}/ws/${wid}`);
          // @ts-ignore
          await waitForMessage(ws, (d: any) => d.type === "state");
          (window as any).__ws = ws;
        },
        { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
      );

      // Test updateLayerName
      const [, nameMsg] = await Promise.all([
        pageA.evaluate(async ({ lid, h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, {
            type: "updateLayerName", payload: { id: lid, name: "Renamed Layer" },
          });
        }, { lid: layerId, h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "updateLayerName");
        }, { h: wsHelpers() }),
      ]);
      expect(nameMsg.payload.name).toBe("Renamed Layer");

      // Test updateLayerColor
      const [, colorMsg] = await Promise.all([
        pageA.evaluate(async ({ lid, h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, {
            type: "updateLayerColor", payload: { id: lid, color: "#00ff00" },
          });
        }, { lid: layerId, h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "updateLayerColor");
        }, { h: wsHelpers() }),
      ]);
      expect(colorMsg.payload.color).toBe("#00ff00");

      // Test toggleLayerVisibility
      const [, visMsg] = await Promise.all([
        pageA.evaluate(async ({ lid, h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, {
            type: "toggleLayerVisibility", payload: { id: lid },
          });
        }, { lid: layerId, h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "toggleLayerVisibility");
        }, { h: wsHelpers() }),
      ]);
      expect(visMsg.payload.actionType).toBe("toggleLayerVisibility");

      // Test reorderLayers - add a second layer first
      // Set up Client B's listener BEFORE Client A sends, to avoid race condition
      const layerId2 = randomUUID();
      const addLayerBroadcastPromise = pageB.evaluate(async ({ h }) => {
        eval(h);
        // @ts-ignore
        return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "addLayer", 10000);
      }, { h: wsHelpers() });

      // Small delay to ensure listener is registered
      await new Promise((r) => setTimeout(r, 100));

      await pageA.evaluate(async ({ lid2, h }) => {
        eval(h);
        // @ts-ignore
        await sendAndWaitAck((window as any).__ws, {
          type: "addLayer", payload: { id: lid2, name: "Layer 2", color: "#0000ff" },
        });
      }, { lid2: layerId2, h: wsHelpers() });

      await addLayerBroadcastPromise;

      const [, reorderMsg] = await Promise.all([
        pageA.evaluate(async ({ lid, lid2, h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, {
            type: "reorderLayers", payload: { layerIds: [lid2, lid] },
          });
        }, { lid: layerId, lid2: layerId2, h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "reorderLayers");
        }, { h: wsHelpers() }),
      ]);
      expect(reorderMsg.payload.actionType).toBe("reorderLayers");

      // Clean up
      await pageA.evaluate(async ({ h }) => { eval(h); /* @ts-ignore */ await closeWS((window as any).__ws); }, { h: wsHelpers() });
      await pageB.evaluate(async ({ h }) => { eval(h); /* @ts-ignore */ await closeWS((window as any).__ws); }, { h: wsHelpers() });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("Editor operations broadcast correctly", async ({ browser }) => {
    const workspaceId = randomUUID();

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Both clients connect
      for (const p of [pageA, pageB]) {
        await p.evaluate(async ({ wsUrl, wid, h }) => {
          eval(h);
          // @ts-ignore
          const ws = await connectWS(`${wsUrl}/ws/${wid}`);
          // @ts-ignore
          await waitForMessage(ws, (d: any) => d.type === "state");
          (window as any).__ws = ws;
        }, { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() });
      }

      // Test addEditor
      const [, addEditorMsg] = await Promise.all([
        pageA.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, { type: "addEditor", payload: { index: 1, name: "Passage 2" } });
        }, { h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "addEditor");
        }, { h: wsHelpers() }),
      ]);
      expect(addEditorMsg.payload.actionType).toBe("addEditor");
      expect(addEditorMsg.payload.name).toBe("Passage 2");

      // Test updateSectionName
      const [, sectionNameMsg] = await Promise.all([
        pageA.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, { type: "updateSectionName", payload: { index: 0, name: "Genesis 1" } });
        }, { h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "updateSectionName");
        }, { h: wsHelpers() }),
      ]);
      expect(sectionNameMsg.payload.name).toBe("Genesis 1");

      // Test toggleSectionVisibility
      const [, toggleVisMsg] = await Promise.all([
        pageA.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, { type: "toggleSectionVisibility", payload: { index: 0 } });
        }, { h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "toggleSectionVisibility");
        }, { h: wsHelpers() }),
      ]);
      expect(toggleVisMsg.payload.actionType).toBe("toggleSectionVisibility");

      // Test removeEditor
      const [, removeEditorMsg] = await Promise.all([
        pageA.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          await sendAndWaitAck((window as any).__ws, { type: "removeEditor", payload: { index: 1 } });
        }, { h: wsHelpers() }),
        pageB.evaluate(async ({ h }) => {
          eval(h);
          // @ts-ignore
          return waitForMessage((window as any).__ws, (d: any) => d.type === "action" && d.payload?.actionType === "removeEditor");
        }, { h: wsHelpers() }),
      ]);
      expect(removeEditorMsg.payload.actionType).toBe("removeEditor");

      // Clean up
      await pageA.evaluate(async ({ h }) => { eval(h); /* @ts-ignore */ await closeWS((window as any).__ws); }, { h: wsHelpers() });
      await pageB.evaluate(async ({ h }) => { eval(h); /* @ts-ignore */ await closeWS((window as any).__ws); }, { h: wsHelpers() });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("Read-only share link access", async ({ page, request }) => {
    const workspaceId = randomUUID();

    // Create workspace via WebSocket
    await page.evaluate(
      async ({ wsUrl, wid, h }) => {
        eval(h);
        // @ts-ignore
        const ws = await connectWS(`${wsUrl}/ws/${wid}`);
        // @ts-ignore
        await waitForMessage(ws, (d: any) => d.type === "state");
        // @ts-ignore
        await closeWS(ws);
      },
      { wsUrl: WS_URL, wid: workspaceId, h: wsHelpers() }
    );

    // Create readonly share link via HTTP
    const shareResp = await request.post(`${BACKEND_URL}/api/share`, {
      data: { workspaceId, access: "readonly" },
    });
    const share = await shareResp.json();
    expect(share.code).toBeTruthy();

    // Resolve - should redirect with ?access=readonly
    const redirect = await request.get(`${BACKEND_URL}/s/${share.code}`, {
      maxRedirects: 0,
    });
    expect(redirect.status()).toBe(302);
    expect(redirect.headers()["location"]).toContain("?access=readonly");
  });

  test("Invalid share access returns error", async ({ request }) => {
    const resp = await request.post(`${BACKEND_URL}/api/share`, {
      data: { workspaceId: "test-workspace", access: "invalid" },
    });
    const body = await resp.json();
    expect(body.error).toBeTruthy();
    expect(body.error).toContain("access");
  });
});
