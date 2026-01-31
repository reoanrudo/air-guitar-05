/**
 * WebSocket通信プロバイダー
 * シンプルなP2P通信代替実装
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

interface WSContextType {
  /** 接続ID (Room ID) */
  roomId: string;
  /** 自身のID */
  deviceId: string | null;
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
}

const WSContext = createContext<WSContextType | undefined>(undefined);

// WebSocketサーバーURL（プラットフォームに応じて自動選択）
const WS_URL = wsConfig.getCurrentUrl();

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomId] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onMessageCallbackRef = useRef<((data: WSMessage) => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // デバイスID初期化
  useEffect(() => {
    async function initDeviceId() {
      try {
        let id = await AsyncStorage.getItem(storageKeys.deviceId);
        if (!id) {
          id = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem(storageKeys.deviceId, id);
        }
        setDeviceId(id);
      } catch (e) {
        logger.error("Failed to load device ID", e);
        const fallbackId = `mobile-${Date.now()}`;
        setDeviceId(fallbackId);
      }
    }
    initDeviceId();
  }, []);

  // Room ID初期化
  useEffect(() => {
    async function initRoomId() {
      try {
        let id = await AsyncStorage.getItem(storageKeys.roomId);
        if (!id) {
          id = "";
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

  // Pingを送信して接続を維持
  const startPing = useCallback(() => {
    stopPing();
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const pingMessage = { type: "PING" as const, payload: {} };
        wsRef.current.send(JSON.stringify(pingMessage));
        wsLogger.heartbeatSent();
      }
    }, timeoutConfig.pingInterval);
  }, []);

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // WebSocket接続を開始
  const connectToPC = useCallback(async (room: string) => {
    setRoomId(room);
    setError(null);

    // 既存の接続をクリア
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      wsLogger.connect(WS_URL);
      const ws = new WebSocket(`${WS_URL}?room=${room.toUpperCase()}&type=mobile&id=${deviceId}`);

      wsRef.current = ws;

      ws.onopen = () => {
        wsLogger.connected();

        // 接続準備完了を通知
        ws.send(JSON.stringify({
          type: "HELLO",
          payload: { deviceId, room: room.toUpperCase() },
        }));

        setIsConnected(true);
        setError(null);
        startPing();
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);

          // メッセージ検証
          const message = safeParseMessage(rawData);
          if (!message) {
            wsLogger.messageParseError(new MessageValidationError("Invalid message structure", rawData));
            return;
          }

          wsLogger.messageReceived(message.type);

          if (message.type === "PONG") {
            // Pong受信 - 接続維持確認
            wsLogger.heartbeatReceived();
            return;
          }

          onMessageCallbackRef.current?.(message);
        } catch (e) {
          wsLogger.messageParseError(e);
        }
      };

      ws.onerror = (event) => {
        wsLogger.error("Connection error", event);
        setError("接続エラーが発生しました");
      };

      ws.onclose = (event) => {
        wsLogger.disconnected(event.code, event.reason);
        setIsConnected(false);
        stopPing();

        // 再接続を試みる
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            logger.info("Attempting to reconnect...");
            connectToPC(room);
          }, timeoutConfig.reconnectInterval);
        }
      };
    } catch (e) {
      logger.error("Failed to connect", e);
      setError("接続に失敗しました");
      setIsConnected(false);
    }
  }, [deviceId, startPing, stopPing]);

  // 切断
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopPing();

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [stopPing]);

  // データ送信
  const sendData = useCallback((data: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      wsLogger.messageSent(data.type);
    } else {
      logger.warn("WebSocket not connected");
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
    <WSContext.Provider
      value={{
        roomId,
        deviceId,
        isConnected,
        connectToPC,
        disconnect,
        sendData,
        onMessage,
        error,
      }}
    >
      {children}
    </WSContext.Provider>
  );
}

/**
 * WebSocket通信フック
 */
export function useWS() {
  const context = useContext(WSContext);
  if (!context) {
    throw new Error("useWS must be used within WSProvider");
  }
  return context;
}
