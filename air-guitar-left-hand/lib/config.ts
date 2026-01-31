/**
 * アプリケーション設定
 * 環境変数から設定値を読み込み、デフォルト値を提供
 */

import { Platform } from "react-native";

// 環境変数から設定値を取得（デフォルト値付き）
const getEnvVar = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * WebSocketサーバー設定
 */
export const wsConfig = {
  /** P2P用WebSocketサーバーURL（プラットフォーム別デフォルト） */
  p2pUrl: Platform.OS === "web"
    ? getEnvVar("EXPO_PUBLIC_P2P_WS_URL", "ws://localhost:8000/ws")
    : getEnvVar("EXPO_PUBLIC_P2P_WS_URL", "ws://localhost:8000/ws"),

  /** Web用WebSocketサーバーURL（デフォルト: localhost:8080） */
  webUrl: getEnvVar("EXPO_PUBLIC_WS_WEB_URL", "ws://localhost:8000/ws"),

  /** モバイル用WebSocketサーバーURL（デフォルト: localhost:8000/ws - adb reverse経由） */
  mobileUrl: getEnvVar("EXPO_PUBLIC_WS_MOBILE_URL", "ws://localhost:8000/ws"),

  /** プラットフォームに応じたWebSocket URLを取得 */
  getCurrentUrl: (): string => {
    return Platform.OS === "web"
      ? wsConfig.webUrl
      : wsConfig.mobileUrl;
  },
};

/**
 * タイムアウト設定（ミリ秒）
 */
export const timeoutConfig = {
  /** WebSocket接続タイムアウト（デフォルト: 10000ms = 10秒） */
  wsConnection: parseInt(getEnvVar("EXPO_PUBLIC_WS_TIMEOUT", "10000"), 10),

  /** Ping間隔（デフォルト: 30000ms = 30秒） */
  pingInterval: parseInt(getEnvVar("EXPO_PUBLIC_PING_INTERVAL", "30000"), 10),

  /** 再接続間隔（デフォルト: 3000ms = 3秒） */
  reconnectInterval: parseInt(getEnvVar("EXPO_PUBLIC_RECONNECT_INTERVAL", "3000"), 10),

  /** Heartbeat送信間隔（デフォルト: 15000ms = 15秒） */
  heartbeatInterval: parseInt(getEnvVar("EXPO_PUBLIC_HEARTBEAT_INTERVAL", "15000"), 10),

  /** Heartbeatタイムアウト（デフォルト: 30000ms = 30秒） */
  heartbeatTimeout: parseInt(getEnvVar("EXPO_PUBLIC_HEARTBEAT_TIMEOUT", "30000"), 10),
};

/**
 * AsyncStorageキー設定
 */
export const storageKeys = {
  /** Room IDのストレージキー */
  roomId: "@air_guitar_room_id",

  /** デバイスIDのストレージキー */
  deviceId: "@air_guitar_device_id",
};
