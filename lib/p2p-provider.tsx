/**
 * P2P通信プロバイダー
 * WebSocketベースのシンプルなP2P通信を提供
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface P2PContextType {
  /** 接続ID */
  connectionId: string;
  /** 接続状態 */
  isConnected: boolean;
  /** PC側に接続 */
  connect: (peerId: string) => Promise<void>;
  /** 切断 */
  disconnect: () => void;
  /** データ送信 */
  sendData: (data: any) => void;
  /** 接続エラー */
  error: string | null;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

const CONNECTION_ID_KEY = "@air_guitar_connection_id";

/**
 * ランダムな接続IDを生成
 */
function generateConnectionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const [connectionId, setConnectionId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 接続ID初期化
  useEffect(() => {
    async function initConnectionId() {
      try {
        let id = await AsyncStorage.getItem(CONNECTION_ID_KEY);
        if (!id) {
          id = generateConnectionId();
          await AsyncStorage.setItem(CONNECTION_ID_KEY, id);
        }
        setConnectionId(id);
      } catch (e) {
        console.error("Failed to load connection ID:", e);
        setConnectionId(generateConnectionId());
      }
    }
    initConnectionId();
  }, []);

  // PC側に接続
  const connect = useCallback(
    async (peerId: string) => {
      if (Platform.OS === "web") {
        // Web環境ではローカルホストに接続
        try {
          const ws = new WebSocket("ws://localhost:8080");
          wsRef.current = ws;

          ws.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
            setError(null);
            // 接続IDを送信
            ws.send(JSON.stringify({ type: "register", id: connectionId }));
          };

          ws.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
          };

          ws.onerror = (e) => {
            console.error("WebSocket error:", e);
            setError("接続に失敗しました");
            setIsConnected(false);
          };
        } catch (e) {
          console.error("Failed to connect:", e);
          setError("接続に失敗しました");
        }
      } else {
        // モバイル環境では実際のP2P接続を試みる
        // 注: 実際の実装では、シグナリングサーバーを使用する必要があります
        console.log("P2P connection not implemented for mobile yet");
        setError("モバイル環境ではまだサポートされていません");
      }
    },
    [connectionId]
  );

  // 切断
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // データ送信
  const sendData = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "data", payload: data }));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <P2PContext.Provider
      value={{
        connectionId,
        isConnected,
        connect,
        disconnect,
        sendData,
        error,
      }}
    >
      {children}
    </P2PContext.Provider>
  );
}

/**
 * P2P通信フック
 */
export function useP2P() {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error("useP2P must be used within P2PProvider");
  }
  return context;
}
