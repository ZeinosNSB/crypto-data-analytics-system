import type { OhlcCandlePayload } from '@workspace/web/types/market.types'

// ─── Client → Server messages ──────────────────────────────────────
export interface WsSubscribeMessage {
  type: 'SUBSCRIBE'
  symbol: string
}

export interface WsUnsubscribeMessage {
  type: 'UNSUBSCRIBE'
  symbol: string
}

export interface WsPingMessage {
  type: 'PING'
}

export type WsClientMessage = WsSubscribeMessage | WsUnsubscribeMessage | WsPingMessage

// ─── Server → Client messages ──────────────────────────────────────
export interface WsConnectedMessage {
  type: 'CONNECTED'
  message: string
}

export interface WsDataMessage {
  type: 'DATA'
  channel: 'ohlc_candle'
  symbol: string
  data: OhlcCandlePayload
}

export interface WsHistoryMessage {
  type: 'OHLC_HISTORY'
  symbol: string
  data: Array<OhlcCandlePayload>
}

export interface WsPongMessage {
  type: 'PONG'
  timestamp: number
}

export interface WsErrorMessage {
  type: 'ERROR'
  message: string
}

export type WsServerMessage = WsConnectedMessage | WsDataMessage | WsHistoryMessage | WsPongMessage | WsErrorMessage

// ─── Connection state ──────────────────────────────────────────────
export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'RECONNECTING'
