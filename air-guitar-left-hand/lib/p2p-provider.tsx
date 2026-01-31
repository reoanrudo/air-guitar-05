/**
 * P2P通信プロバイダー
 * WebSocketベースのシンプルなP2P通信を提供
 * 接続の安定性に特化
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface P2PContextType {
  /** 接続ID (Room ID) - 手動で設定 */
  roomId: string;
  /** Room IDを設定 */
  setRoomId: (id: string) => void;
  /** 接続状態 */
  isConnected: boolean;
  /** PC側に接続 */
  connectToPC: (roomId: string) => Promise<void>;
  /** 切断 */
  disconnect: () => void;
  /** データ送信 */
  sendData: (data: any) => void;
  /** 接続エラー */
  error: string | null;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

const CONNECTION_ID_KEY = "@air_guitar_room_id_v2";

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomIdState] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket接続と接続状態を管理するref
  const wsRef = useRef<WebSocket | null>(null);
  const isIntentionalDisconnectRef = useRef(false);

  // Room ID設定関数
  const setRoomId = useCallback((id: string) => {
    setRoomIdState(id);
    AsyncStorage.setItem(CONNECTION_ID_KEY, id);
  }, []);

  // Room ID初期化
  useEffect(() => {
    async function initRoomId() {
      try {
        let id = await AsyncStorage.getItem(CONNECTION_ID_KEY);
        setRoomIdState(id || "");
      } catch (e) {
        console.error("Failed to load room ID:", e);
        setRoomIdState("");
      }
    }
    initRoomId();
  }, []);

  // PC側に接続
  const connectToPC = useCallback(
    async (roomToConnect: string) => {
      // 既存の接続がある場合は閉じる（意図的な切断）
      if (wsRef.current) {
        isIntentionalDisconnectRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }

      // エラー状態をリセット
      setError(null);
      setIsConnected(false);
      isIntentionalDisconnectRef.current = false;

      const wsUrl = "ws://127.0.0.1:8000/ws";
      console.log("🔌 Connecting to:", wsUrl);

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected!");
          setIsConnected(true);
          setError(null);

          // Room IDを登録メッセージとして送信
          try {
            ws.send(JSON.stringify({ type: "register", id: roomId }));
            console.log("📤 Sent register message for room:", roomId);
          } catch (e) {
            console.error("Failed to send register:", e);
          }
        };

        ws.onclose = (event) => {
          console.log("🔌 WebSocket closed:", event.code, event.reason);
          setIsConnected(false);

          // 意図的な切断でない場合のみエラーを表示
          if (!isIntentionalDisconnectRef.current) {
            setError(`接続が切れました (code: ${event.code})`);
          }
        };

        ws.onerror = (e: any) => {
          // エラーログのみ（oncloseで詳細を処理）
          console.warn("⚠️ WebSocket error event:", e);
        };
      } catch (e: any) {
        const errorMsg = e?.message || String(e);
        console.error("❌ Connection failed:", errorMsg);
        setError(`接続失敗: ${errorMsg}`);
        setIsConnected(false);
      }
    },
    [roomId]
  );

  // 切断
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      isIntentionalDisconnectRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  // データ送信
  const sendData = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "data", payload: data }));
    } else {
      console.warn("Cannot send: WebSocket not connected");
    }
  }, []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        isIntentionalDisconnectRef.current = true;
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <P2PContext.Provider
      value={{
        roomId,
        setRoomId,
        isConnected,
        connectToPC,
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
