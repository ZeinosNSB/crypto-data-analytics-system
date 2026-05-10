'use client'

import { useUIStore } from '@workspace/web/stores/ui.store'
import React from 'react'

export function BottomPanel() {
  const activeBottomTab = useUIStore(state => state.activeBottomTab)
  const setActiveBottomTab = useUIStore(state => state.setActiveBottomTab)

  const tabs = [
    { id: 'positions', label: 'Positions (0)' },
    { id: 'orders', label: 'Open Orders (0)' },
    { id: 'history', label: 'Order History' },
    { id: 'assets', label: 'Assets' }
  ] as const

  return (
    <div className='flex h-full flex-col bg-[#0f1116]'>
      {/* Tabs */}
      <div className='flex h-10 items-center gap-4 border-b border-slate-800 px-4'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveBottomTab(tab.id)}
            className={`h-full border-b-2 text-sm font-medium transition-colors ${
              activeBottomTab === tab.id
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className='flex-1 overflow-auto'>
        <table className='w-full border-collapse text-left'>
          <thead className='sticky top-0 z-10 border-b border-slate-800/50 bg-[#0f1116] text-xs text-slate-500'>
            <tr>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Symbol</th>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Size</th>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Entry Price</th>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Mark Price</th>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Liq. Price</th>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Margin Ratio</th>
              <th className='px-4 py-2 font-medium whitespace-nowrap'>Margin</th>
              <th className='px-4 py-2 text-right font-medium whitespace-nowrap'>PNL (ROE%)</th>
              <th className='px-4 py-2 text-right font-medium whitespace-nowrap'>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} className='py-8 text-center text-sm text-slate-500'>
                You have no open positions.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
