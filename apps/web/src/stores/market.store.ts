import { create } from 'zustand'
import type { MarketStats } from '@workspace/web/types/market.types'

interface MarketState {
  stats: Record<string, MarketStats>
  setStats: (symbol: string, stats: MarketStats) => void
  bulkSetStats: (stats: Record<string, MarketStats>) => void
}

export const useMarketStore = create<MarketState>(set => ({
  stats: {},
  setStats: (symbol, stat) =>
    set(state => ({
      stats: { ...state.stats, [symbol]: stat }
    })),
  bulkSetStats: stats => set({ stats })
}))
