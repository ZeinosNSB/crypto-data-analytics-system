'use client'

import { Volume24hPanel } from '@workspace/web/components/trading/bottom-panel/volume24h-panel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/web/components/ui/table'
import { useUIStore } from '@workspace/web/stores/ui.store'
import React from 'react'

const POSITION_HEADERS = [
  'Symbol',
  'Size',
  'Entry Price',
  'Mark Price',
  'Liq. Price',
  'Margin Ratio',
  'Margin',
  'PNL (ROE%)',
  'Action'
] as const

const EMPTY_MESSAGES: Record<string, string> = {
  positions: 'You have no open positions.',
  orders: 'You have no open orders.',
  history: 'No order history.',
  assets: 'No assets to display.'
}

export function BottomPanel() {
  const activeBottomTab = useUIStore(state => state.activeBottomTab)
  const setActiveBottomTab = useUIStore(state => state.setActiveBottomTab)

  const tabs = [
    { id: 'positions', label: 'Positions (0)' },
    { id: 'orders', label: 'Open Orders (0)' },
    { id: 'history', label: 'Order History' },
    { id: 'assets', label: 'Assets' },
    { id: 'volume', label: '24h Volume' }
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
        {activeBottomTab === 'volume' ? (
          <Volume24hPanel />
        ) : (
          <Table>
            <TableHeader className='sticky top-0 z-10 bg-[#0f1116]'>
              <TableRow className='border-slate-800/50 hover:bg-transparent'>
                {POSITION_HEADERS.map(header => (
                  <TableHead key={header} className='text-slate-500'>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className='border-0 hover:bg-transparent'>
                <TableCell colSpan={POSITION_HEADERS.length} className='py-8 text-center text-sm text-slate-500'>
                  {EMPTY_MESSAGES[activeBottomTab] ?? ''}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
