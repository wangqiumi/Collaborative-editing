// server/y-websocket.js
import * as http from 'http'
import { setupWSConnection } from 'y-websocket/bin/utils.js'
import WebSocket, { WebSocketServer } from 'ws'

// 创建 HTTP 服务器
const server = http.createServer()

// 创建 WebSocket 服务
const wss = new WebSocketServer({ server })

// 为每个连接设置 yjs 协同处理器
wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true })  // 可配置选项，如垃圾回收等
})

// 启动服务
const PORT = 1234
server.listen(PORT, () => {
  console.log(`✅ y-websocket 3.0 server running at ws://localhost:${PORT}`)
})
