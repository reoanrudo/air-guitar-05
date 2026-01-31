/**
 * WebSocket通信プロバイダー（シンプル版）
 * Pythonサーバーと直接通信
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { wsConfig, timeoutConfig, storageKeys } from "./config";
import { wsLogger, logger } from "./logger";
import { safeParseMessage, MessageValidationError } from "../types/websocket";
import type { WSMessage } from "../types/websocket";

interface P2PContextType {
  /** 接続ID (Room ID) */
  roomId: string;
  /** 接続状態 */
  isConnected: boolean;
  /** PC側に接続 */
  connectToPC: (roomId: string) => Promise<void>;
  /** 切断 */
  disconnect: () => void;
  /** データ送信 */
  sendData: (data: WSMessage) => void;
  /** メッセージ受信コールバック */
  onMessage: (callback: (data: WSMessage) => void) => void;
  /** 接続エラー */
  error: string | null;
  /** 最後のHeartbeat受信時刻 */
  lastHeartbeat: number | null;
}

const P2PContext = createContext<P2PContextType | undefined>(undefined);

const { p2pUrl } = wsConfig;

export function P2PProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onMessageCallbackRef = useRef<((data: WSMessage) => void) | null>(
    null,
  );
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Room ID初期化
  useEffect(() => {
    async function initRoomId() {
      try {
        let id = await AsyncStorage.getItem(storageKeys.roomId);
        if (!id) {
          id = "TEST";
        }
        setRoomId(id);
      } catch (e) {
        logger.error("Failed to load room ID", e);
      }
    }
    initRoomId();
  }, []);

  // Room IDを保存
  useEffect(() => {
    if (roomId) {
      AsyncStorage.setItem(storageKeys.roomId, roomId);
    }
  }, [roomId]);

  // Heartbeatを停止
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Heartbeatを開始
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    // 定期的にHeartbeatを送信
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const heartbeatMessage: WSMessage = {
          type: "READY",
          payload: { timestamp: Date.now() },
        };
        wsRef.current.send(JSON.stringify(heartbeatMessage));
        wsLogger.heartbeatSent();
      }
    }, timeoutConfig.heartbeatInterval);
  }, [stopHeartbeat]);

  // PC側に接続
  const connectToPC = useCallback(async (room: string) => {
    setRoomId(room);
    setError(null);
    setIsConnected(false);

    try {
      wsLogger.connect(p2pUrl);

      // まず既存の接続を切断
      if (wsRef.current) {
        wsRef.current.close();
      }

      // WebSocket接続
      const ws = new WebSocket(p2pUrl);
      wsRef.current = ws;

      // 接続タイムアウトを設定
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isConnected) {
          ws.close();
          setError("接続タイムアウト: サーバーが応答しません\n\n確認事項:\n- PCアプリが起動しているか\n- シグナリングサーバー(ポート3001)が起動しているか\n- ADB reverseが設定されているか");
        }
      }, timeoutConfig.wsConnection);

      ws.onopen = () => {
        wsLogger.connected();
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);

          // シグナリングサーバーからのID受信（特殊メッセージ）
          if (rawData.type === "id") {
            logger.info(`Connected to PC app, ID: ${rawData.id}`);
            setIsConnected(true);
            setError(null);
            setLastHeartbeat(Date.now());
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
            }
            startHeartbeat();
            return;
          }

          // メッセージ検証
          const message = safeParseMessage(rawData);
          if (!message) {
            wsLogger.messageParseError(new MessageValidationError("Invalid message structure", rawData));
            return;
          }

          wsLogger.messageReceived(message.type);

          // Heartbeat受信時は時刻を更新
          if (message.type === "READY") {
            setLastHeartbeat(Date.now());
            wsLogger.heartbeatReceived();
            return;
          }

          // PCからのデータを受信
          if (onMessageCallbackRef.current) {
            onMessageCallbackRef.current(message);
          }
        } catch (e) {
          wsLogger.messageParseError(e);
        }
      };

      ws.onerror = (event) => {
        wsLogger.error("Connection failed", event);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        setError("WebSocketエラー: 接続に失敗しました\n\n確認事項:\n- PCアプリが起動しているか\n- シグナリングサーバー(ポート3001)が起動しているか");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        wsLogger.disconnected(event.code);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        if (!isConnected) {
          setError(`接続が閉じられました (code: ${event.code})\n\nサーバーが起動していない可能性があります`);
        }
        setIsConnected(false);
        stopHeartbeat();
      };

    } catch (e) {
      logger.error("Failed to connect", e);
      setError(`接続エラー: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [startHeartbeat, stopHeartbeat]);

  // 切断
  const disconnect = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setLastHeartbeat(null);
  }, []);

  // データ送信
  const sendData = useCallback((data: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // シグナリングサーバーに送信（typeフィールドを直接使用）
      wsRef.current.send(JSON.stringify({
        type: data.type,
        payload: data.payload,
      }));
      wsLogger.messageSent(data.type);
    } else {
      logger.warn("Not connected to server");
    }
  }, []);

  // メッセージ受信コールバック設定
  const onMessage = useCallback((callback: (data: WSMessage) => void) => {
    onMessageCallbackRef.current = callback;
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <P2PContext.Provider
      value={{
        roomId,
        isConnected,
        connectToPC,
        disconnect,
        sendData,
        onMessage,
        error,
        lastHeartbeat,
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
