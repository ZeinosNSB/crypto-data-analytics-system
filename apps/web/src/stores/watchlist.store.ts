import { create } from 'zustand'
import type { WatchlistSymbol } from '@workspace/web/types/market.types'

interface WatchlistState {
  symbols: Array<WatchlistSymbol>
  updateSymbol: (symbol: string, updates: Partial<WatchlistSymbol>) => void
  setSymbols: (symbols: Array<WatchlistSymbol>) => void
}

export const useWatchlistStore = create<WatchlistState>(set => ({
  symbols: [
    { symbol: 'BTCUSDT', lastPrice: 0, priceChange: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, sparkline: [] },
    { symbol: 'ETHUSDT', lastPrice: 0, priceChange: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, sparkline: [] },
    { symbol: 'SOLUSDT', lastPrice: 0, priceChange: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, sparkline: [] },
    { symbol: 'BNBUSDT', lastPrice: 0, priceChange: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, sparkline: [] },
    { symbol: 'XRPUSDT', lastPrice: 0, priceChange: 0, changePercent24h: 0, volume24h: 0, high24h: 0, low24h: 0, sparkline: [] }
  ],
  updateSymbol: (symbolId, updates) =>
    set(state => ({
      symbols: state.symbols.map(item => (item.symbol === symbolId ? { ...item, ...updates } : item))
    })),
  setSymbols: symbols => set({ symbols })
}))
