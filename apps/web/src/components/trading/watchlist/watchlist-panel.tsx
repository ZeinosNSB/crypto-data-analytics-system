'use client'

import { MagnifyingGlassIcon, StarIcon } from '@phosphor-icons/react'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { useWatchlistStore } from '@workspace/web/stores/watchlist.store'
import { formatCurrency } from '@workspace/web/utils/chart.utils'
import React, { useState } from 'react'

export function WatchlistPanel() {
  const [search, setSearch] = useState('')
  const symbols = useWatchlistStore(state => state.symbols)
  const activeSymbol = useChartStore(state => state.activeSymbol)
  const setActiveSymbol = useChartStore(state => state.setActiveSymbol)

  const filteredSymbols = symbols.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className='flex h-full flex-col bg-[#0f1116]'>
      <div className='border-b border-slate-800 p-3'>
        <div className='relative'>
          <MagnifyingGlassIcon className='absolute top-1/2 left-3 -translate-y-1/2 text-slate-500' size={16} />
          <input
            type='text'
            placeholder='Search symbol...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full rounded border border-slate-700/50 bg-[#131722] py-1.5 pr-3 pl-9 text-sm text-slate-200 transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none'
          />
        </div>
      </div>

      <div className='sticky top-0 z-10 flex border-b border-slate-800/50 bg-[#0f1116] px-3 py-2 text-xs font-medium text-slate-500'>
        <div className='flex-1'>Symbol</div>
        <div className='w-20 text-right'>Price</div>
        <div className='w-16 text-right'>Change</div>
      </div>

      <div className='scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex-1 overflow-x-hidden overflow-y-auto'>
        {filteredSymbols.map(item => {
          const isUp = item.changePercent24h >= 0
          const colorClass = isUp ? 'text-green-500' : 'text-red-500'
          const bgHoverClass = 'hover:bg-[#1a1e29]'
          const activeClass =
            item.symbol === activeSymbol ? 'bg-[#1a1e29] border-l-2 border-blue-500' : 'border-l-2 border-transparent'

          return (
            <div
              key={item.symbol}
              onClick={() => setActiveSymbol(item.symbol)}
              className={`flex cursor-pointer items-center px-3 py-2 transition-colors ${activeClass} ${bgHoverClass}`}
            >
              <div className='flex flex-1 items-center gap-2'>
                <StarIcon
                  size={14}
                  weight={item.symbol === activeSymbol ? 'fill' : 'regular'}
                  className={item.symbol === activeSymbol ? 'text-yellow-500' : 'text-slate-600'}
                />
                <span className='text-sm font-semibold text-slate-200'>{item.symbol}</span>
              </div>

              <div className='flex w-20 flex-col justify-center text-right'>
                <span className={`text-sm font-medium ${colorClass}`}>
                  {formatCurrency(item.lastPrice, item.lastPrice < 10 ? 4 : 2)}
                </span>
              </div>

              <div className='flex w-16 flex-col justify-center text-right'>
                <span
                  className={`ml-auto inline-block rounded px-1.5 py-0.5 text-xs font-medium ${isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                >
                  {isUp ? '+' : ''}
                  {item.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
