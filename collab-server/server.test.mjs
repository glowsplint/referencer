import { describe, it, expect, afterAll } from "bun:test";
import http from "http";

// We test the health endpoint by starting a minimal HTTP server that
// mirrors the collab server's health check logic, or by importing and
// exercising the real server. Since the real server starts listening on
// import, we instead test the health endpoint of a running server.
// We start the server as a subprocess and test against it.

const TEST_PORT = 14444;

let serverProcess;

async function startServer() {
  serverProcess = Bun.spawn(["node", "server.mjs"], {
    cwd: import.meta.dir,
    env: { ...process.env, PORT: String(TEST_PORT), HOST: "127.0.0.1" },
    stdout: "pipe",
    stderr: "pipe",
  });

  // Wait for server to be ready by polling
  const maxWait = 10000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Collab server did not start in time");
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    await serverProcess.exited;
  }
}

describe("collab-server", () => {
  afterAll(async () => {
    await stopServer();
  });

  it("starts and responds to health check", async () => {
    await startServer();

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.rooms).toBe("number");
    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns text response for root path", async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/`);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toContain("collab server");
  });
});
