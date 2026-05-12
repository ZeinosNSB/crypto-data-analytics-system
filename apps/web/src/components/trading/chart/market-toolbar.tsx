'use client'

import { CameraIcon, CaretDownIcon, FadersHorizontalIcon, LineSegmentsIcon, TrendUpIcon } from '@phosphor-icons/react'
import { useChartStore } from '@workspace/web/stores/chart.store'
import React from 'react'

export function MarketToolbar() {
  const activeTimeframe = useChartStore(state => state.activeTimeframe)
  const setActiveTimeframe = useChartStore(state => state.setActiveTimeframe)

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D']

  return (
    <div className='flex h-10 items-center justify-between border-b border-slate-800 bg-[#0f1116] px-2'>
      <div className='flex items-center gap-1'>
        {/* Timeframes */}
        <div className='mr-4 flex items-center space-x-1 border-r border-slate-800 pr-4'>
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTimeframe === tf
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
          <button className='rounded px-1.5 py-1 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'>
            <CaretDownIcon size={14} />
          </button>
        </div>

        {/* Indicators */}
        <div className='mr-4 flex items-center gap-2 border-r border-slate-800 pr-4'>
          <button className='flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200'>
            <TrendUpIcon size={16} />
            <span>Indicators</span>
          </button>
          <button className='flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200'>
            <LineSegmentsIcon size={16} />
          </button>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          className='rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200'
          title='Settings'
        >
          <FadersHorizontalIcon size={16} />
        </button>
        <button
          className='rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200'
          title='Screenshot'
        >
          <CameraIcon size={16} />
        </button>
      </div>
    </div>
  )
}
