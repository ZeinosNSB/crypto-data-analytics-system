import { envConfig } from '@workspace/web/config/env'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { useMarketStore } from '@workspace/web/stores/market.store'
import { useWatchlistStore } from '@workspace/web/stores/watchlist.store'
import { useWebsocketStore } from '@workspace/web/stores/websocket.store'
import { toChartTime } from '@workspace/web/utils/chart.utils'
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

export function useMarketWebsocket(symbol: string) {
  const prevSymbolRef = useRef<string | null>(null)

  const handleMessage = useCallback(
    (event: MessageEvent<string>) => {
      let msg: WsServerMessage
      try {
        msg = JSON.parse(event.data) as WsServerMessage
      } catch {
        return
      }

      switch (msg.type) {
        case 'OHLC_HISTORY': {
          if (msg.symbol === symbol) {
            useChartStore.getState().setHistoryFromBackend(msg.data)
          }
          break
        }

        case 'DATA': {
          if (msg.channel === 'ohlc_candle') {
            const candle = candlePayloadToChartCandle(msg.data)

            if (msg.symbol === useChartStore.getState().activeSymbol) {
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
    },
    [symbol]
  )

  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    onMessage: handleMessage,
    shouldReconnect: () => true,
    reconnectAttempts: 20,
    reconnectInterval: (attemptNumber: number) => Math.min(1000 * Math.pow(2, attemptNumber), 30000),
    heartbeat: {
      message: JSON.stringify({ type: 'PING' } satisfies WsClientMessage),
      returnMessage: 'pong',
      interval: 25000,
      timeout: 60000
    }
  })

  // Sync readyState → Zustand store
  useEffect(() => {
    const state = READY_STATE_MAP[readyState] ?? 'DISCONNECTED'
    useWebsocketStore.getState().setConnectionState(state)
  }, [readyState])

  // Handle symbol subscribe/unsubscribe on changes
  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return

    // Unsubscribe from previous symbol
    if (prevSymbolRef.current && prevSymbolRef.current !== symbol) {
      sendJsonMessage({ type: 'UNSUBSCRIBE', symbol: prevSymbolRef.current } satisfies WsClientMessage)
    }

    // Clear chart for new symbol
    useChartStore.getState().setCandles([])

    // Subscribe to new symbol
    sendJsonMessage({ type: 'SUBSCRIBE', symbol } satisfies WsClientMessage)
    prevSymbolRef.current = symbol
  }, [symbol, readyState, sendJsonMessage])
}
