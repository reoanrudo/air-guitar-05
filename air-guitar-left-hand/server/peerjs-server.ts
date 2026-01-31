/**
 * PeerJSシグナリングサーバー
 * P2P通信のためのシグナリングを提供
 */

import { Express } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { ExpressPeerServer } from "peer";

export function registerPeerJSServer(app: Express) {
  const httpServer = createServer(app);

  // Socket.IO for additional signaling if needed
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // PeerJS server
  const peerServer = ExpressPeerServer(httpServer, {
    debug: true,
    path: "/peerjs",
    allow_discovery: true,
  });

  // Mount PeerJS server
  app.use("/peerjs", peerServer);

  // Basic connection logging
  peerServer.on("connection", (client) => {
    console.log(`[PeerJS] Client connected: ${client.getId()}`);
  });

  peerServer.on("disconnect", (client) => {
    console.log(`[PeerJS] Client disconnected: ${client.getId()}`);
  });

  return httpServer;
}
