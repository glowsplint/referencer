import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { WorkspaceWSClient } from "./ws-client"

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = []
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  url: string
  readyState = MockWebSocket.CONNECTING
  onopen: (() => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  sentMessages: string[] = []

  // Instance constants matching class statics
  readonly CONNECTING = MockWebSocket.CONNECTING
  readonly OPEN = MockWebSocket.OPEN
  readonly CLOSING = MockWebSocket.CLOSING
  readonly CLOSED = MockWebSocket.CLOSED

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ code: 1000, reason: "" } as CloseEvent)
  }
}

beforeEach(() => {
  MockWebSocket.instances = []
  vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("WorkspaceWSClient", () => {
  it("creates a WebSocket connection with correct URL", () => {
    const client = new WorkspaceWSClient("test-workspace")
    client.connect()

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(MockWebSocket.instances[0].url).toContain("/ws/test-workspace")

    client.disconnect()
  })

  it("sends messages as JSON when connected", () => {
    const client = new WorkspaceWSClient("test-workspace")
    client.connect()

    const ws = MockWebSocket.instances[0]
    ws.simulateOpen()

    const requestId = client.send("addLayer", {
      id: "l1",
      name: "Layer 1",
      color: "#ff0000",
    })

    expect(ws.sentMessages).toHaveLength(1)
    const sent = JSON.parse(ws.sentMessages[0])
    expect(sent.type).toBe("addLayer")
    expect(sent.payload.id).toBe("l1")
    expect(sent.requestId).toBe(requestId)

    client.disconnect()
  })

  it("handles incoming messages and dispatches to handlers", () => {
    const client = new WorkspaceWSClient("test-workspace")
    const handler = vi.fn()

    client.on("state", handler)
    client.connect()

    const ws = MockWebSocket.instances[0]
    ws.simulateOpen()
    ws.simulateMessage({ type: "state", payload: { workspaceId: "test" } })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].type).toBe("state")

    client.disconnect()
  })

  it("reports connected state correctly", () => {
    const client = new WorkspaceWSClient("test-workspace")

    client.connect()
    const ws = MockWebSocket.instances[0]
    // Before open, should not be connected
    expect(client.connected).toBe(false)

    ws.simulateOpen()
    expect(client.connected).toBe(true)

    client.disconnect()
  })

  it("unsubscribes handler when calling returned function", () => {
    const client = new WorkspaceWSClient("test-workspace")
    const handler = vi.fn()

    const unsubscribe = client.on("state", handler)
    client.connect()

    const ws = MockWebSocket.instances[0]
    ws.simulateOpen()
    ws.simulateMessage({ type: "state", payload: {} })
    expect(handler).toHaveBeenCalledOnce()

    unsubscribe()
    ws.simulateMessage({ type: "state", payload: {} })
    expect(handler).toHaveBeenCalledOnce() // Still only once

    client.disconnect()
  })

  it("emits _connected event on open", () => {
    const client = new WorkspaceWSClient("test-workspace")
    const onConnected = vi.fn()

    client.on("_connected", onConnected)
    client.connect()

    const ws = MockWebSocket.instances[0]
    ws.simulateOpen()
    expect(onConnected).toHaveBeenCalledOnce()

    client.disconnect()
  })

  it("emits _disconnected event on close", () => {
    const client = new WorkspaceWSClient("test-workspace")
    const onDisconnected = vi.fn()

    client.on("_disconnected", onDisconnected)
    client.connect()

    const ws = MockWebSocket.instances[0]
    ws.simulateOpen()
    // Simulate the server closing the connection
    ws.simulateClose()

    expect(onDisconnected).toHaveBeenCalledOnce()

    client.disconnect()
  })
})
