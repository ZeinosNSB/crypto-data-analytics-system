'use client'

import { BottomPanel } from '@workspace/web/components/trading/bottom-panel/bottom-panel'
import { MarketToolbar } from '@workspace/web/components/trading/chart/market-toolbar'
import { TradingChart } from '@workspace/web/components/trading/chart/trading-chart'
import { TopNavbar } from '@workspace/web/components/trading/layout/top-navbar'
import { WatchlistPanel } from '@workspace/web/components/trading/watchlist/watchlist-panel'
import { useMarketWebsocket } from '@workspace/web/hooks/use-market-websocket'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { useUIStore } from '@workspace/web/stores/ui.store'
import React, { useEffect } from 'react'

export function TerminalLayout() {
  const { rightPanelOpen, bottomPanelOpen } = useUIStore()
  const setActiveBottomTab = useUIStore(state => state.setActiveBottomTab)
  const activeSymbol = useChartStore(state => state.activeSymbol)

  useMarketWebsocket(activeSymbol)

  useEffect(() => {
    setActiveBottomTab('volume')
  }, [setActiveBottomTab])

  return (
    <div className='flex h-screen w-full flex-col overflow-hidden bg-[#0f1116] font-sans text-slate-300 selection:bg-blue-500/30'>
      <TopNavbar />

      <div className='flex flex-1 overflow-hidden'>
        <main className='flex flex-1 flex-col overflow-hidden border-l border-slate-800'>
          <MarketToolbar />

          <div className='flex flex-1 overflow-hidden'>
            {/* Chart Area */}
            <div className='relative flex-1 bg-[#131722]'>
              <TradingChart />
            </div>

            {/* Right Watchlist */}
            {rightPanelOpen && (
              <div className='flex w-80 flex-col border-l border-slate-800 bg-[#0f1116]'>
                <WatchlistPanel />
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          {bottomPanelOpen && (
            <div className='h-64 border-t border-slate-800 bg-[#0f1116]'>
              <BottomPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
