import { toChartTime } from '@workspace/web/utils/chart.utils'
import { create } from 'zustand'
import type { CandleData, OhlcCandlePayload } from '@workspace/web/types/market.types'

interface ChartState {
  activeSymbol: string
  activeTimeframe: string
  candles: Array<CandleData>
  currentCandle: CandleData | null

  setActiveSymbol: (symbol: string) => void
  setActiveTimeframe: (timeframe: string) => void
  setCandles: (candles: Array<CandleData>) => void
  updateCurrentCandle: (candle: CandleData) => void
  setHistoryFromBackend: (payloads: Array<OhlcCandlePayload>) => void
}

function payloadToCandle(payload: OhlcCandlePayload): CandleData {
  return {
    time: toChartTime(payload.bucket_start),
    open: parseFloat(payload.open),
    high: parseFloat(payload.high),
    low: parseFloat(payload.low),
    close: parseFloat(payload.close),
    volume: parseFloat(payload.volume)
  }
}

export const useChartStore = create<ChartState>(set => ({
  activeSymbol: 'BTCUSDT',
  activeTimeframe: '1m',
  candles: [],
  currentCandle: null,

  setActiveSymbol: symbol => set({ activeSymbol: symbol }),
  setActiveTimeframe: timeframe => set({ activeTimeframe: timeframe }),
  setCandles: candles => set({ candles, currentCandle: candles[candles.length - 1] || null }),

  setHistoryFromBackend: payloads => {
    const candles = payloads.map(payloadToCandle)
    set({ candles, currentCandle: candles[candles.length - 1] || null })
  },

  updateCurrentCandle: candle =>
    set(state => {
      if (state.candles.length === 0) {
        return { currentCandle: candle, candles: [candle] }
      }

      const lastCandle = state.candles[state.candles.length - 1]
      const newCandles = [...state.candles]

      if (candle.time > lastCandle.time) {
        newCandles.push(candle)
      } else if (candle.time === lastCandle.time) {
        newCandles[newCandles.length - 1] = candle
      }

      return {
        currentCandle: candle,
        candles: newCandles
      }
    })
}))
