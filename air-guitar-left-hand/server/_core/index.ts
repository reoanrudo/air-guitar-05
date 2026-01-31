import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { WebSocketServer, WebSocket } from "ws";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ExpressPeerServer } from "peerjs-server";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // PeerJSシグナリングサーバー
  const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/peerjs",
    allow_discovery: true,
  });

  peerServer.on("connection", (client) => {
    console.log(`[PeerJS] Client connected: ${client.getId()}`);
  });

  peerServer.on("disconnect", (client) => {
    console.log(`[PeerJS] Client disconnected: ${client.getId()}`);
  });

  // WebSocketサーバー for PC-Mobile通信
  const wss = new WebSocketServer({ server, path: "/ws" });

  // PCとスマホのWebSocket接続を管理
  const pcConnections = new Set<WebSocket>();
  const mobileConnections = new Set<WebSocket>();

  wss.on("connection", (ws: WebSocket, req) => {
    const userAgent = req.headers["user-agent"] || "";
    console.log(`[WS] New connection. User-Agent: ${userAgent}`);

    // React Native/ExpoのUser-Agentを検出
    const isMobile = /mobile|android|iphone|ipad|expo|react-native|okhttp/i.test(userAgent);

    if (isMobile) {
      // スマホからの接続
      mobileConnections.add(ws);
      console.log(`[WS] ✅ Mobile connected. Total mobile: ${mobileConnections.size}, Total PC: ${pcConnections.size}`);

      // スマホが期待する形式で接続確認メッセージを送信
      ws.send(JSON.stringify({ type: "id", id: "mobile-" + Date.now() }));

      ws.on("message", (data) => {
        // スマホからのメッセージをPCに転送
        const messageStr = data.toString();
        console.log(`[WS] Mobile -> PC: ${messageStr.substring(0, 100)}`);

        pcConnections.forEach((pcWs) => {
          if (pcWs.readyState === WebSocket.OPEN) {
            pcWs.send(data);
          }
        });
      });

      ws.on("close", () => {
        mobileConnections.delete(ws);
        console.log(`[WS] Mobile disconnected. Remaining mobile: ${mobileConnections.size}`);
      });

      ws.on("error", (err) => {
        console.error(`[WS] Mobile error:`, err);
        mobileConnections.delete(ws);
      });
    } else {
      // PCからの接続
      pcConnections.add(ws);
      console.log(`[WS] ✅ PC connected. Total PC: ${pcConnections.size}, Total mobile: ${mobileConnections.size}`);

      ws.on("message", (data) => {
        // PCからのメッセージをスマホに転送
        const messageStr = data.toString();
        console.log(`[WS] PC -> Mobile: ${messageStr.substring(0, 100)}`);

        mobileConnections.forEach((mobileWs) => {
          if (mobileWs.readyState === WebSocket.OPEN) {
            mobileWs.send(data);
          }
        });
      });

      ws.on("close", () => {
        pcConnections.delete(ws);
        console.log(`[WS] PC disconnected. Remaining PC: ${pcConnections.size}`);
      });

      ws.on("error", (err) => {
        console.error(`[WS] PC error:`, err);
        pcConnections.delete(ws);
      });
    }
  });

  const preferredPort = parseInt(process.env.PORT || "3001");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Listen on all interfaces (0.0.0.0) so mobile devices can connect
  server.listen(port, "0.0.0.0", () => {
    console.log(`[api] server listening on 0.0.0.0:${port}`);
    console.log(`[PeerJS] signaling server running on /peerjs`);
    console.log(`[WS] WebSocket server running on /ws`);
  });
}

startServer().catch(console.error);
