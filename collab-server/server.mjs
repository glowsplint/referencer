// Y-websocket collaboration server with LevelDB persistence.
// Stores Y.Doc state to disk so documents survive server restarts.
// Documents are loaded from LevelDB on first client connection and
// flushed back periodically and on disconnect.
import http from 'http'
import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import { LeveldbPersistence } from 'y-leveldb'
import { setupWSConnection, getYDoc } from 'y-websocket/bin/utils'
import path from 'path'
import { fileURLToPath } from 'url'

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

  const timer = setInterval(async () => {
    if (!dirty) return
    dirty = false
    try {
      await persistence.storeUpdate(docName, Y.encodeStateAsUpdate(ydoc))
    } catch (err) {
      console.error(`[collab] persistence flush error for ${docName}:`, err)
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

// HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', persistence: 'leveldb', dbDir: DB_DIR }))
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
    await bindPersistence(docName, ydoc)
  }

  setupWSConnection(conn, req, { docName })

  conn.on('close', () => {
    console.log(`[collab] client disconnected from room: ${docName}`)
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
