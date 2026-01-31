/**
 * WebSocket通信関連の型定義
 */

/**
 * WebSocketメッセージタイプ
 */
export type WSMessageType =
  | "CHORD_CHANGE"
  | "STRINGS_PRESSED"
  | "STRINGS_RELEASED"
  | "FRET_UPDATE"
  | "STRUM_EVENT"
  | "READY"
  | "HELLO"
  | "PING"
  | "PONG";

/**
 * WebSocketメッセージの基本型
 */
export interface BaseWSMessage {
  type: WSMessageType;
  payload: unknown;
}

/**
 * コード変更メッセージ
 */
export interface ChordChangeMessage extends BaseWSMessage {
  type: "CHORD_CHANGE";
  payload: {
    chord: string;
    timestamp?: number;
  };
}

/**
 * 弦押下メッセージ
 */
export interface StringsPressedMessage extends BaseWSMessage {
  type: "STRINGS_PRESSED";
  payload: {
    strings: number[];
    timestamp?: number;
  };
}

/**
 * 弦解放メッセージ
 */
export interface StringsReleasedMessage extends BaseWSMessage {
  type: "STRINGS_RELEASED";
  payload: {
    strings: number[];
    timestamp?: number;
  };
}

/**
 * フレット更新メッセージ
 */
export interface FretUpdateMessage extends BaseWSMessage {
  type: "FRET_UPDATE";
  payload: {
    string: number;
    fret: number;
    timestamp?: number;
  };
}

/**
 * ストロークイベントメッセージ
 */
export interface StrumEventMessage extends BaseWSMessage {
  type: "STRUM_EVENT";
  payload: {
    direction: "up" | "down";
    timestamp?: number;
  };
}

/**
 * 準備完了メッセージ
 */
export interface ReadyMessage extends BaseWSMessage {
  type: "READY";
  payload: {
    deviceId?: string;
    timestamp?: number;
  };
}

/**
 * 接続開始メッセージ
 */
export interface HelloMessage extends BaseWSMessage {
  type: "HELLO";
  payload: {
    deviceId: string;
    room: string;
    timestamp?: number;
  };
}

/**
 * Pingメッセージ
 */
export interface PingMessage extends BaseWSMessage {
  type: "PING";
  payload: Record<string, never>;
}

/**
 * Pongメッセージ
 */
export interface PongMessage extends BaseWSMessage {
  type: "PONG";
  payload: Record<string, never>;
}

/**
 * WebSocketメッセージの共用体型
 */
export type WSMessage =
  | ChordChangeMessage
  | StringsPressedMessage
  | StringsReleasedMessage
  | FretUpdateMessage
  | StrumEventMessage
  | ReadyMessage
  | HelloMessage
  | PingMessage
  | PongMessage;

/**
 * メッセージ検証エラー
 */
export class MessageValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidData: unknown
  ) {
    super(message);
    this.name = "MessageValidationError";
  }
}

/**
 * 有効なメッセージタイプのリスト
 */
const VALID_MESSAGE_TYPES: readonly string[] = [
  "CHORD_CHANGE",
  "STRINGS_PRESSED",
  "STRINGS_RELEASED",
  "FRET_UPDATE",
  "STRUM_EVENT",
  "READY",
  "HELLO",
  "PING",
  "PONG",
] as const;

/**
 * 基本型ガード関数
 */
export function isWSMessage(data: unknown): data is WSMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const message = data as Record<string, unknown>;

  return (
    typeof message.type === "string" &&
    VALID_MESSAGE_TYPES.includes(message.type)
  );
}

/**
 * メッセージのペイロードを検証
 */
export function validateMessagePayload(
  message: WSMessage
): message is WSMessage {
  switch (message.type) {
    case "CHORD_CHANGE":
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        "chord" in message.payload &&
        typeof (message.payload as Record<string, unknown>).chord === "string"
      );

    case "STRINGS_PRESSED":
    case "STRINGS_RELEASED":
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        "strings" in message.payload &&
        Array.isArray((message.payload as Record<string, unknown>).strings)
      );

    case "FRET_UPDATE":
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        "string" in message.payload &&
        "fret" in message.payload &&
        typeof (message.payload as Record<string, unknown>).string === "number" &&
        typeof (message.payload as Record<string, unknown>).fret === "number"
      );

    case "STRUM_EVENT":
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        "direction" in message.payload &&
        typeof (message.payload as Record<string, unknown>).direction === "string" &&
        ["up", "down"].includes(
          (message.payload as Record<string, unknown>).direction as string
        )
      );

    case "HELLO":
      return (
        typeof message.payload === "object" &&
        message.payload !== null &&
        "deviceId" in message.payload &&
        "room" in message.payload &&
        typeof (message.payload as Record<string, unknown>).deviceId === "string" &&
        typeof (message.payload as Record<string, unknown>).room === "string"
      );

    case "PING":
    case "PONG":
      return true;

    case "READY":
      return typeof message.payload === "object" && message.payload !== null;

    default:
      return false;
  }
}

/**
 * メッセージをパースして検証
 */
export function parseAndValidateMessage(data: unknown): WSMessage {
  // 基本構造の検証
  if (!isWSMessage(data)) {
    throw new MessageValidationError(
      "Invalid message structure or unknown message type",
      data
    );
  }

  // ペイロードの検証
  if (!validateMessagePayload(data)) {
    throw new MessageValidationError(
      `Invalid payload for message type: ${data.type}`,
      data
    );
  }

  return data;
}

/**
 * メッセージを安全にパース（エラー時にnullを返す）
 */
export function safeParseMessage(data: unknown): WSMessage | null {
  try {
    return parseAndValidateMessage(data);
  } catch {
    return null;
  }
}
