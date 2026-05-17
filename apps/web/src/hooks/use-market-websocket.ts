import { useChartStore } from '@workspace/web/stores/chart.store'
import { useMarketStore } from '@workspace/web/stores/market.store'
import { useWatchlistStore } from '@workspace/web/stores/watchlist.store'
import { useWebsocketStore } from '@workspace/web/stores/websocket.store'
import { toChartTime } from '@workspace/web/utils/chart'
import { useCallback, useEffect, useRef } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import type { OhlcCandlePayload } from '@workspace/web/types/market.types'
import type { WatchlistSymbol } from '@workspace/web/types/market.types'
import type { ConnectionState, WsClientMessage, WsServerMessage } from '@workspace/web/types/websocket.types'

function getWebSocketUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:4000/api/v1/ws'
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/api/v1/ws`
}

const READY_STATE_MAP: Record<number, ConnectionState> = {
  [ReadyState.CONNECTING]: 'CONNECTING',
  [ReadyState.OPEN]: 'CONNECTED',
  [ReadyState.CLOSING]: 'DISCONNECTED',
  [ReadyState.CLOSED]: 'DISCONNECTED',
  [ReadyState.UNINSTANTIATED]: 'DISCONNECTED'
}

function candlePayloadToChartCandle(payload: OhlcCandlePayload) {
  return {
    time: toChartTime(payload.bucket_start),
    open: parseFloat(payload.open),
    high: parseFloat(payload.high),
    low: parseFloat(payload.low),
    close: parseFloat(payload.close),
    volume: parseFloat(payload.volume)
  }
}

function updateStoresFromCandle(symbol: string, payload: OhlcCandlePayload) {
  const open = parseFloat(payload.open)
  const close = parseFloat(payload.close)
  const high = parseFloat(payload.high)
  const low = parseFloat(payload.low)
  const volume = parseFloat(payload.volume)
  const priceChange = close - open
  const previousWatchlistPrice =
    useWatchlistStore.getState().symbols.find((item: WatchlistSymbol) => item.symbol === symbol)?.lastPrice ?? 0
  const changeBasePrice = previousWatchlistPrice > 0 ? previousWatchlistPrice : open
  const changePercent = changeBasePrice !== 0 ? ((close - changeBasePrice) / changeBasePrice) * 100 : 0
  const priceDelta = close - changeBasePrice

  useWatchlistStore.getState().updateSymbol(symbol, {
    lastPrice: close,
    priceChange: priceDelta,
    changePercent24h: changePercent,
    volume24h: volume,
    high24h: high,
    low24h: low
  })

  useMarketStore.getState().setStats(symbol, {
    symbol,
    lastPrice: close,
    priceChange,
    priceChangePercent: changePercent,
    high,
    low,
    volume,
    quoteVolume: 0
  })
}

export function useMarketWebsocket(activeSymbol: string) {
  const prevActiveRef = useRef<string | null>(null)
  const subscribedRef = useRef<Set<string>>(new Set())
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleMessage = useCallback((event: MessageEvent<string>) => {
    let msg: WsServerMessage
    try {
      msg = JSON.parse(event.data) as WsServerMessage
    } catch {
      return
    }

    switch (msg.type) {
      case 'OHLC_HISTORY': {
        if (msg.symbol === useChartStore.getState().activeSymbol) {
          useChartStore.getState().setHistoryFromBackend(msg.data)
        }
        break
      }

      case 'DATA': {
        if (msg.channel === 'ohlc_candle') {
          if (msg.symbol === useChartStore.getState().activeSymbol) {
            const candle = candlePayloadToChartCandle(msg.data)
            useChartStore.getState().updateCurrentCandle(candle)
          }

          updateStoresFromCandle(msg.symbol, msg.data)
        }
        break
      }

      case 'CONNECTED':
      case 'PONG':
      case 'ERROR':
        break
    }
  }, [])

  const { sendJsonMessage, readyState } = useWebSocket(getWebSocketUrl(), {
    onMessage: handleMessage,
    shouldReconnect: () => true,
    reconnectAttempts: 20,
    reconnectInterval: (attemptNumber: number) => Math.min(1000 * Math.pow(2, attemptNumber), 30000)
  })

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
      return
    }

    pingIntervalRef.current = setInterval(() => {
      sendJsonMessage({ type: 'PING' } satisfies WsClientMessage)
    }, 25_000)

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    }
  }, [readyState, sendJsonMessage])

  useEffect(() => {
    const state = READY_STATE_MAP[readyState] ?? 'DISCONNECTED'
    useWebsocketStore.getState().setConnectionState(state)
  }, [readyState])

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return

    const watchlistSymbols = useWatchlistStore.getState().symbols.map((s: WatchlistSymbol) => s.symbol)

    for (const sym of watchlistSymbols) {
      if (!subscribedRef.current.has(sym)) {
        sendJsonMessage({ type: 'SUBSCRIBE', symbol: sym } satisfies WsClientMessage)
        subscribedRef.current.add(sym)
      }
    }

    return () => {
      subscribedRef.current.clear()
    }
  }, [readyState, sendJsonMessage])

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return

    const prev = prevActiveRef.current

    if (prev !== activeSymbol) {
      useChartStore.getState().setCandles([])

      if (!subscribedRef.current.has(activeSymbol)) {
        sendJsonMessage({ type: 'SUBSCRIBE', symbol: activeSymbol } satisfies WsClientMessage)
        subscribedRef.current.add(activeSymbol)
      } else {
        sendJsonMessage({ type: 'UNSUBSCRIBE', symbol: activeSymbol } satisfies WsClientMessage)
        sendJsonMessage({ type: 'SUBSCRIBE', symbol: activeSymbol } satisfies WsClientMessage)
      }

      prevActiveRef.current = activeSymbol
    }
  }, [activeSymbol, readyState, sendJsonMessage])
}
