import { createServer } from 'http';
import { ExpressPeerServer } from 'peer';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const server = createServer(app);

// モバイル用WebSocketサーバー（別ポートで起動）
const wsServer = createServer();
const wss = new WebSocketServer({ server: wsServer });

// サーバーエラーハンドリング
wss.on('error', (error) => {
  console.error('❌ WebSocket Server Error:', error);
});

wsServer.on('error', (error) => {
  console.error('❌ HTTP Server Error:', error);
});

// モバイルクライアントを管理
const mobileClients = new Map<string, WebSocket>();
let mobileClientId = 0;

wss.on('connection', (ws: WebSocket, req) => {
  const id = `mobile_${mobileClientId++}`;
  mobileClients.set(id, ws);

  console.log(`📱 モバイル接続: ${id} from ${req.socket.remoteAddress}`);

  // 接続IDを送信
  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 ${id} から受信:`, message.type);

      // モバイルからのコードデータ
      if (message.type === 'CHORD_CHANGE' || message.type === 'STRINGS_PRESSED' ||
          message.type === 'STRINGS_RELEASED' || message.type === 'FRET_UPDATE' ||
          message.type === 'STRUM_EVENT' || message.type === 'READY') {
        console.log(`🎸 モバイルコードデータ:`, message);

        // 全モバイルクライアントにブロードキャスト
        mobileClients.forEach((client, clientId) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              ...message,
              senderId: id
            }));
          }
        });
      }
    } catch (err) {
      console.error('❌ メッセージ解析エラー:', err);
    }
  });

  ws.on('close', () => {
    console.log(`📴 モバイル切断: ${id}`);
    mobileClients.delete(id);
  });

  ws.on('error', (error) => {
    console.error(`❌ エラー (${id}):`, error);
  });
});

// PeerJSシグナリングサーバー（ポート3001）
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  debug: true,
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`🔗 PeerJS接続: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`🔌 PeerJS切断: ${client.getId()}`);
});

// PeerJSサーバー起動（ポート3001）
const PEER_PORT = 3001;
server.listen(PEER_PORT, () => {
  console.log(`🚀 PeerJSサーバー起動: http://localhost:${PEER_PORT}`);
  console.log(`📡 PeerJS: http://localhost:${PEER_PORT}/peerjs`);
});

// WebSocketサーバー起動（ポート3002）
const WS_PORT = 3002;
wsServer.listen(WS_PORT, () => {
  console.log(`📱 モバイルWSサーバー起動: ws://localhost:${WS_PORT}`);
});
