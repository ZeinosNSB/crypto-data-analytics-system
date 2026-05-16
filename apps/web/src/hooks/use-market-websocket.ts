import { envConfig } from '@workspace/web/config/env'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { useMarketStore } from '@workspace/web/stores/market.store'
import { useWatchlistStore } from '@workspace/web/stores/watchlist.store'
import { useWebsocketStore } from '@workspace/web/stores/websocket.store'
import { toChartTime } from '@workspace/web/utils/chart'
import { useCallback, useEffect, useRef } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import type { OhlcCandlePayload } from '@workspace/web/types/market.types'
import type { ConnectionState, WsClientMessage, WsServerMessage } from '@workspace/web/types/websocket.types'

const WS_URL = envConfig.NEXT_PUBLIC_WEBSOCKET_ENDPOINT + '/ws'

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
  const price = parseFloat(payload.close)

  useWatchlistStore.getState().updateSymbol(symbol, {
    lastPrice: price,
    volume24h: parseFloat(payload.volume)
  })

  useMarketStore.getState().setStats(symbol, {
    symbol,
    lastPrice: price,
    priceChange: parseFloat(payload.close) - parseFloat(payload.open),
    priceChangePercent:
      parseFloat(payload.open) !== 0
        ? ((parseFloat(payload.close) - parseFloat(payload.open)) / parseFloat(payload.open)) * 100
        : 0,
    high: parseFloat(payload.high),
    low: parseFloat(payload.low),
    volume: parseFloat(payload.volume),
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

  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
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

    const watchlistSymbols = useWatchlistStore.getState().symbols.map(s => s.symbol)

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
