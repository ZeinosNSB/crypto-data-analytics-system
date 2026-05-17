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
const REDIS_OHLC_CHANNEL = 'hotpath:ohlc:1m:channel'
const SUBSCRIBE_RETRY_MAX_DELAY_MS = 30_000
const STATUS_LOG_INTERVAL_MS = 30_000

let isPubSubInitialized = false
let isRedisChannelSubscribed = false
let subscribeRetryAttempt = 0
let subscribeRetryTimer: ReturnType<typeof setTimeout> | null = null
let statusLogTimer: ReturnType<typeof setInterval> | null = null
let isSubscribing = false

function sendTypedMessage(ws: ServerWebSocket, msg: WsServerMessage) {
  ws.send(JSON.stringify(msg))
}

function scheduleSubscribeRetry(error: unknown, reason: string) {
  if (subscribeRetryTimer) {
    return
  }

  subscribeRetryAttempt += 1
  const delayMs = Math.min(1000 * 2 ** (subscribeRetryAttempt - 1), SUBSCRIBE_RETRY_MAX_DELAY_MS)
  const errMessage = error instanceof Error ? error.message : String(error)

  log.warn({
    msg: `[ws] Subscribe retry #${subscribeRetryAttempt} for ${REDIS_OHLC_CHANNEL} in ${delayMs}ms (${reason})`,
    error: errMessage
  })

  subscribeRetryTimer = setTimeout(() => {
    subscribeRetryTimer = null
    void attemptChannelSubscribe('retry')
  }, delayMs)
}

async function attemptChannelSubscribe(trigger: string) {
  if (isRedisChannelSubscribed || isSubscribing) {
    return
  }

  if (redisPubSub.status !== 'ready') {
    scheduleSubscribeRetry(new Error(`redisPubSub status is ${redisPubSub.status}`), `trigger=${trigger}`)
    return
  }

  isSubscribing = true
  try {
    await redisPubSub.subscribe(REDIS_OHLC_CHANNEL)
    isRedisChannelSubscribed = true
    subscribeRetryAttempt = 0

    if (subscribeRetryTimer) {
      clearTimeout(subscribeRetryTimer)
      subscribeRetryTimer = null
    }

    log.info({ msg: `[ws] Subscribed to ${REDIS_OHLC_CHANNEL}` })
  } catch (err) {
    isRedisChannelSubscribed = false
    scheduleSubscribeRetry(err, `trigger=${trigger}`)
  } finally {
    isSubscribing = false
  }
}

function markPubSubNotSubscribed(reason: string) {
  if (isRedisChannelSubscribed || isSubscribing) {
    log.warn({ msg: `[ws] Marking Redis Pub/Sub as unsubscribed (${reason})` })
  }
  isRedisChannelSubscribed = false
  isSubscribing = false
}

export function initWebSocketPubSub() {
  if (isPubSubInitialized) {
    return
  }
  isPubSubInitialized = true

  log.info({ msg: 'Initializing Redis Pub/Sub for WebSockets...' })

  redisPubSub.on('ready', () => {
    log.info({ msg: '[ws] Redis Pub/Sub ready, ensuring subscription...' })
    void attemptChannelSubscribe('ready')
  })

  redisPubSub.on('connect', () => {
    log.info({ msg: '[ws] Redis Pub/Sub connected, ensuring subscription...' })
    void attemptChannelSubscribe('connect')
  })

  redisPubSub.on('reconnecting', () => {
    markPubSubNotSubscribed('reconnecting')
  })

  redisPubSub.on('close', () => {
    markPubSubNotSubscribed('close')
  })

  redisPubSub.on('end', () => {
    markPubSubNotSubscribed('end')
  })

  redisPubSub.on('message', (channel, message) => {
    if (channel !== REDIS_OHLC_CHANNEL) {
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

  if (!statusLogTimer) {
    statusLogTimer = setInterval(() => {
      log.info({
        msg: `[ws] ws_pubsub_subscribed=${isRedisChannelSubscribed}`,
        redis_pubsub_status: redisPubSub.status
      })
    }, STATUS_LOG_INTERVAL_MS)
  }

  void attemptChannelSubscribe('init')
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
