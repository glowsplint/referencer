import type { ClientMessage, ServerMessage } from "./ws-protocol"

type MessageHandler = (message: ServerMessage) => void

const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

let nextId = 0

export class WorkspaceWSClient {
  private ws: WebSocket | null = null
  private url: string
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectDelay = INITIAL_RECONNECT_DELAY
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true

  constructor(workspaceId: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    this.url = `${protocol}//${window.location.host}/ws/${workspaceId}`
  }

  connect(): void {
    this.shouldReconnect = true
    this.createConnection()
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type: string, payload: Record<string, unknown>): string {
    const requestId = `req_${++nextId}`
    const message: ClientMessage = { type, payload, requestId }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn(`[ws-client] Message dropped (socket not open): ${type}`, payload)
    }
    return requestId
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private createConnection(): void {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      this.reconnectDelay = INITIAL_RECONNECT_DELAY
      this.emit("_connected", {
        type: "state",
        payload: {},
      } as ServerMessage)
    }

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data)
        this.emit(message.type, message)
      } catch (error) {
        console.warn("[ws-client] Failed to parse incoming message:", event.data, error)
      }
    }

    this.ws.onclose = () => {
      this.emit("_disconnected", {
        type: "state",
        payload: {},
      } as ServerMessage)
      this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  private emit(type: string, message: ServerMessage): void {
    const handlers = this.handlers.get(type)
    if (handlers) {
      for (const handler of handlers) {
        handler(message)
      }
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.createConnection()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      MAX_RECONNECT_DELAY
    )
  }
}
