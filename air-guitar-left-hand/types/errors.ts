/**
 * アプリケーションエラー定義
 */

/**
 * 基底エラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * WebSocket接続エラー
 */
export class WebSocketError extends AppError {
  constructor(
    message: string,
    public readonly originalError?: Error,
    recoverable: boolean = true
  ) {
    super(message, "WEBSOCKET_ERROR", recoverable);
    this.name = "WebSocketError";
  }
}

/**
 * 接続タイムアウトエラー
 */
export class ConnectionTimeoutError extends WebSocketError {
  constructor(message: string = "接続タイムアウト: サーバーが応答しません") {
    super(message, undefined, true);
    this.name = "ConnectionTimeoutError";
    this.code = "CONNECTION_TIMEOUT";
  }
}

/**
 * メッセージ解析エラー
 */
export class MessageParseError extends AppError {
  constructor(
    message: string,
    public readonly invalidData: unknown
  ) {
    super(message, "MESSAGE_PARSE_ERROR", true);
    this.name = "MessageParseError";
  }
}

/**
 * ストレージエラー
 */
export class StorageError extends AppError {
  constructor(
    message: string,
    public readonly key?: string,
    public readonly originalError?: Error
  ) {
    super(message, "STORAGE_ERROR", true);
    this.name = "StorageError";
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message, "VALIDATION_ERROR", false);
    this.name = "ValidationError";
  }
}

/**
 * ユーザーへの表示用エラーメッセージを生成
 */
export function getDisplayMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "予期しないエラーが発生しました";
}

/**
 * エラーが回復可能かどうかを判定
 */
export function isRecoverable(error: unknown): boolean {
  return error instanceof AppError && error.recoverable;
}

/**
 * エラーログ用の情報を抽出
 */
export function getErrorInfo(error: unknown): {
  name: string;
  message: string;
  code?: string;
  recoverable?: boolean;
} {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      recoverable: error.recoverable,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}
