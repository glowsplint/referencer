import http from 'http'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const PORT = parseInt(process.env.PORT || '4444', 10)
const HOST = process.env.HOST || '0.0.0.0'

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('referencer collab server')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (conn, req) => {
  const docName = req.url?.slice(1)?.split('?')[0] || 'default'
  console.log(`[collab] client connected to room: ${docName}`)
  setupWSConnection(conn, req, { docName })
  conn.on('close', () => {
    console.log(`[collab] client disconnected from room: ${docName}`)
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[collab] y-websocket server running on ${HOST}:${PORT}`)
})
