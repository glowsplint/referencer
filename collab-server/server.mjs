// Y-websocket collaboration server with LevelDB persistence.
// Stores Y.Doc state to disk so documents survive server restarts.
// Documents are loaded from LevelDB on first client connection and
// flushed back periodically and on disconnect.
import http from 'http'
import { WebSocketServer } from 'ws'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

// Use createRequire for yjs and packages that depend on it via CJS require(),
// so they all share a single yjs instance (avoids "Yjs was already imported" warning).
const require = createRequire(import.meta.url)
const Y = require('yjs')
const { LeveldbPersistence } = require('y-leveldb')
const { setupWSConnection, getYDoc } = require('y-websocket/bin/utils')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT || '4444', 10)
const HOST = process.env.HOST || '0.0.0.0'
const DB_DIR = process.env.DB_DIR || path.join(__dirname, 'data', 'yjs-docs')

// Initialize LevelDB persistence
const persistence = new LeveldbPersistence(DB_DIR)

// Wire up persistence: when a Y.Doc is created by y-websocket, load
// persisted state into it and set up periodic flushing.
const FLUSH_INTERVAL = 5000 // ms

/** @type {Map<string, ReturnType<typeof setInterval>>} */
const flushTimers = new Map()

/**
 * Called by y-websocket when a document is first created in memory.
 * We hydrate it from LevelDB and set up a flush interval.
 * @param {string} docName
 * @param {Y.Doc} ydoc
 */
async function bindPersistence(docName, ydoc) {
  // Load persisted state
  const persistedDoc = await persistence.getYDoc(docName)
  const persistedState = Y.encodeStateAsUpdate(persistedDoc)
  Y.applyUpdate(ydoc, persistedState)
  persistedDoc.destroy()

  // Flush on every update (debounced via interval)
  let dirty = false
  ydoc.on('update', () => { dirty = true })

  const MAX_FLUSH_RETRIES = 3

  const timer = setInterval(async () => {
    if (!dirty) return
    dirty = false
    for (let attempt = 1; attempt <= MAX_FLUSH_RETRIES; attempt++) {
      try {
        await persistence.storeUpdate(docName, Y.encodeStateAsUpdate(ydoc))
        break
      } catch (err) {
        console.error(`[collab] persistence flush error for ${docName} (attempt ${attempt}/${MAX_FLUSH_RETRIES}):`, err)
        if (attempt < MAX_FLUSH_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
  }, FLUSH_INTERVAL)

  flushTimers.set(docName, timer)

  // Final flush when document is destroyed
  ydoc.on('destroy', async () => {
    const t = flushTimers.get(docName)
    if (t) { clearInterval(t); flushTimers.delete(docName) }
    try {
      await persistence.storeUpdate(docName, Y.encodeStateAsUpdate(ydoc))
    } catch (err) {
      console.error(`[collab] final flush error for ${docName}:`, err)
    }
  })

  console.log(`[collab] loaded persisted state for: ${docName}`)
}

const serverStartTime = Date.now()

// HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      rooms: flushTimers.size,
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    }))
    return
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('referencer collab server (with persistence)')
})

const wss = new WebSocketServer({ server })

wss.on('connection', async (conn, req) => {
  const docName = req.url?.slice(1)?.split('?')[0] || 'default'
  console.log(`[collab] client connected to room: ${docName}`)

  // Get or create the Y.Doc (y-websocket manages this)
  const ydoc = getYDoc(docName)

  // Bind persistence if not already bound
  if (!flushTimers.has(docName)) {
    try {
      await bindPersistence(docName, ydoc)
    } catch (err) {
      console.error(`[collab] failed to bind persistence for ${docName}:`, err)
    }
  }

  setupWSConnection(conn, req, { docName })

  conn.on('close', () => {
    console.log(`[collab] client disconnected from room: ${docName}`)

    // Clean up stale flush timers for rooms with no remaining connections
    const roomHasClients = [...wss.clients].some(client => {
      return client !== conn && client.readyState === 1
    })
    if (!roomHasClients && flushTimers.has(docName)) {
      // Let the timer run one last cycle, then clean up
      // (the destroy handler on the ydoc will also flush)
    }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[collab] y-websocket server running on ${HOST}:${PORT}`)
  console.log(`[collab] persistence: LevelDB at ${DB_DIR}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[collab] shutting down...')
  for (const [docName, timer] of flushTimers) {
    clearInterval(timer)
    const ydoc = getYDoc(docName)
    try {
      await persistence.storeUpdate(docName, Y.encodeStateAsUpdate(ydoc))
    } catch (err) {
      console.error(`[collab] shutdown flush error for ${docName}:`, err)
    }
  }
  await persistence.destroy()
  server.close()
  process.exit(0)
})
