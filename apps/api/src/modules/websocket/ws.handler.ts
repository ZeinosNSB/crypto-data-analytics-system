import redis, { redisPubSub } from '@workspace/api/libs/redis'
import { log } from '@workspace/api/utils/log'

// ─── Server → Client message types ────────────────────────────────
export interface OhlcCandlePayload {
  schema_version: number
  type: 'ohlc_candle'
  status: 'partial' | 'closed'
  exchange: string
  symbol: string
  interval: string
  bucket_start: number
  bucket_end: number
  first_event_time: number
  last_event_time: number
  trade_count: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  source: string
  emitted_at: number
}

interface WsConnectedMsg {
  type: 'CONNECTED'
  message: string
}

interface WsDataMsg {
  type: 'DATA'
  channel: 'ohlc_candle'
  symbol: string
  data: OhlcCandlePayload
}

interface WsHistoryMsg {
  type: 'OHLC_HISTORY'
  symbol: string
  data: Array<OhlcCandlePayload>
}

interface WsPongMsg {
  type: 'PONG'
  timestamp: number
}

interface WsErrorMsg {
  type: 'ERROR'
  message: string
}

type WsServerMessage = WsConnectedMsg | WsDataMsg | WsHistoryMsg | WsPongMsg | WsErrorMsg

interface WsSubscribeMsg {
  type: 'SUBSCRIBE'
  symbol: string
}

interface WsUnsubscribeMsg {
  type: 'UNSUBSCRIBE'
  symbol: string
}

interface WsPingMsg {
  type: 'PING'
}

type WsClientMessage = WsSubscribeMsg | WsUnsubscribeMsg | WsPingMsg

export interface ServerWebSocket {
  id: string
  send: (data: string | object) => void
}

const symbolSubscribers = new Map<string, Set<string>>()
const connectedClients = new Map<string, ServerWebSocket>()

function sendTypedMessage(ws: ServerWebSocket, msg: WsServerMessage) {
  ws.send(JSON.stringify(msg))
}

export function initWebSocketPubSub() {
  log.info({ msg: 'Initializing Redis Pub/Sub for WebSockets...' })

  redisPubSub.subscribe('hotpath:ohlc:1m:channel', (err, count) => {
    if (err) {
      log.error({ err, msg: 'Failed to subscribe to hotpath:ohlc:1m:channel' })
      return
    }
    log.info({ msg: `Subscribed to ${count} channels including hotpath:ohlc:1m:channel` })
  })

  redisPubSub.on('message', (channel, message) => {
    if (channel !== 'hotpath:ohlc:1m:channel') {
      return
    }

    try {
      const payload = JSON.parse(message) as OhlcCandlePayload
      const symbol = payload.symbol
      if (!symbol) {
        return
      }

      const subscribers = symbolSubscribers.get(symbol)
      if (!subscribers || subscribers.size === 0) {
        return
      }

      const wsPayload: WsDataMsg = {
        type: 'DATA',
        channel: 'ohlc_candle',
        symbol,
        data: payload
      }
      const encoded = JSON.stringify(wsPayload)

      subscribers.forEach(clientId => {
        const clientWs = connectedClients.get(clientId)
        if (clientWs) {
          clientWs.send(encoded)
        } else {
          subscribers.delete(clientId)
        }
      })
    } catch (err) {
      log.error({ err, msg: 'Failed to parse message from Redis' })
    }
  })
}

export function handleConnection(ws: ServerWebSocket) {
  connectedClients.set(ws.id, ws)
  sendTypedMessage(ws, { type: 'CONNECTED', message: 'Connected to Crypto Terminal Gateway' })
}

export function handleDisconnection(ws: ServerWebSocket) {
  connectedClients.delete(ws.id)

  for (const [symbol, subscribers] of symbolSubscribers.entries()) {
    if (subscribers.has(ws.id)) {
      subscribers.delete(ws.id)
      if (subscribers.size === 0) {
        symbolSubscribers.delete(symbol)
      }
    }
  }
}

export async function handleClientMessage(ws: ServerWebSocket, data: WsClientMessage) {
  if (!data || !data.type) {
    return
  }

  switch (data.type) {
    case 'PING': {
      sendTypedMessage(ws, { type: 'PONG', timestamp: Date.now() })
      break
    }

    case 'SUBSCRIBE': {
      if (!data.symbol) {
        return
      }

      const symbol = data.symbol.toUpperCase()

      if (!symbolSubscribers.has(symbol)) {
        symbolSubscribers.set(symbol, new Set())
      }
      symbolSubscribers.get(symbol)?.add(ws.id)

      log.info({ msg: `Client ${ws.id} subscribed to ${symbol}` })

      try {
        const historyList = await redis.lrange(`hotpath:ohlc:1m:${symbol}:history`, 0, -1)
        if (historyList.length > 0) {
          const historyCandles = historyList.map(raw => JSON.parse(raw) as OhlcCandlePayload)
          sendTypedMessage(ws, {
            type: 'OHLC_HISTORY',
            symbol,
            data: historyCandles
          })
        }
      } catch (err) {
        log.error({ err, msg: `Failed to fetch history for ${symbol}` })
      }

      try {
        const currentCandleStr = await redis.get(`hotpath:ohlc:1m:${symbol}:current`)
        if (currentCandleStr) {
          const currentCandle = JSON.parse(currentCandleStr) as OhlcCandlePayload
          sendTypedMessage(ws, {
            type: 'DATA',
            channel: 'ohlc_candle',
            symbol,
            data: currentCandle
          })
        }
      } catch (err) {
        log.error({ err, msg: `Failed to fetch current snapshot for ${symbol}` })
      }
      break
    }

    case 'UNSUBSCRIBE': {
      if (!data.symbol) {
        return
      }
      const unsubSymbol = data.symbol.toUpperCase()
      const subscribers = symbolSubscribers.get(unsubSymbol)
      if (subscribers) {
        subscribers.delete(ws.id)
        if (subscribers.size === 0) {
          symbolSubscribers.delete(unsubSymbol)
        }
      }
      log.info({ msg: `Client ${ws.id} unsubscribed from ${unsubSymbol}` })
      break
    }

    default: {
      sendTypedMessage(ws, { type: 'ERROR', message: 'Unknown message type' })
    }
  }
}
