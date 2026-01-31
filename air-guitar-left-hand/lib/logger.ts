/**
 * ロギングユーティリティ
 * コンソールログを一元管理
 */

import { getErrorInfo, type AppError } from "../types/errors";

type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * ログレベルの設定
 * 本番環境では info 以上のみ出力
 */
const shouldLog = (level: LogLevel): boolean => {
  if (process.env.NODE_ENV === "production") {
    return level === "error" || level === "warn";
  }
  return true;
};

/**
 * ログプレフィックスを追加
 */
const addPrefix = (level: LogLevel, message: string): string => {
  const prefixes = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    debug: "🔍",
  };
  return `${prefixes[level]} ${message}`;
};

/**
 * ログ出力
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (shouldLog("info")) {
      console.log(addPrefix("info", message), ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog("warn")) {
      console.warn(addPrefix("warn", message), ...args);
    }
  },

  error: (message: string, error?: unknown) => {
    if (shouldLog("error")) {
      const errorInfo = error ? getErrorInfo(error) : null;
      if (errorInfo) {
        console.error(
          addPrefix("error", message),
          `[${errorInfo.name}] ${errorInfo.message}`,
          errorInfo.code ? `(Code: ${errorInfo.code})` : "",
          errorInfo.recoverable !== undefined ? `(Recoverable: ${errorInfo.recoverable})` : ""
        );
      } else {
        console.error(addPrefix("error", message), error);
      }
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog("debug")) {
      console.debug(addPrefix("debug", message), ...args);
    }
  },
};

/**
 * WebSocket通信用ロガー
 */
export const wsLogger = {
  connect: (url: string) => {
    logger.info(`Connecting to WebSocket: ${url}`);
  },

  connected: () => {
    logger.info("WebSocket connected");
  },

  disconnected: (code?: number, reason?: string) => {
    logger.info(`WebSocket disconnected${code ? ` (code: ${code})` : ""}${reason ? `: ${reason}` : ""}`);
  },

  error: (message: string, error?: unknown) => {
    logger.error(`WebSocket error: ${message}`, error);
  },

  messageSent: (type: string) => {
    logger.debug(`Sent message: ${type}`);
  },

  messageReceived: (type: string) => {
    logger.debug(`Received message: ${type}`);
  },

  messageParseError: (error: unknown) => {
    logger.error("Failed to parse WebSocket message", error);
  },

  heartbeatSent: () => {
    logger.debug("Heartbeat sent");
  },

  heartbeatReceived: () => {
    logger.debug("Heartbeat received");
  },
};
