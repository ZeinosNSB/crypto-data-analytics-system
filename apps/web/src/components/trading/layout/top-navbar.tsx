'use client'

import { WifiHighIcon, WifiSlashIcon } from '@phosphor-icons/react'
import { useVolume24hBySymbol } from '@workspace/web/hooks/use-volume24h'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { useMarketStore } from '@workspace/web/stores/market.store'
import { useWebsocketStore } from '@workspace/web/stores/websocket.store'
import { formatCurrency } from '@workspace/web/utils/chart'
import { formatVolume } from '@workspace/web/utils/format'
import Image from 'next/image'
import React from 'react'

export function TopNavbar() {
  const activeSymbol = useChartStore(state => state.activeSymbol)
  const stats = useMarketStore(state => state.stats[activeSymbol])
  const connectionState = useWebsocketStore(state => state.connectionState)
  const { data: volumeData } = useVolume24hBySymbol(activeSymbol)

  const isUp = stats?.priceChangePercent ? stats.priceChangePercent >= 0 : true
  const priceColor = isUp ? 'text-green-500' : 'text-red-500'

  return (
    <div className='flex h-14 items-center justify-between border-b border-slate-800 bg-[#0f1116] px-4'>
      {/* Left section: Logo & Pair info */}
      <div className='flex items-center gap-6'>
        <div className='mr-4 flex cursor-pointer items-center gap-2'>
          <div className='from-primary to-accent relative flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br'>
            <Image src='/logo.svg' alt='CryptoStream logo' fill sizes='48px' className='object-contain' priority />
          </div>
        </div>

        <div className='flex items-center gap-8'>
          <div className='flex flex-col justify-center'>
            <span className='cursor-pointer text-xl font-bold text-slate-100 transition-colors hover:text-blue-400'>
              {activeSymbol}
            </span>
            <span className='text-xs font-medium tracking-wide text-slate-500'>Perpetual</span>
          </div>

          {stats ? (
            <>
              <div className='flex flex-col justify-center'>
                <span className={`text-lg font-semibold ${priceColor}`}>{formatCurrency(stats.lastPrice, 4)}</span>
                <span className='text-xs text-slate-500 line-through'>${formatCurrency(stats.lastPrice, 4)}</span>
              </div>

              <div className='hidden flex-col justify-center sm:flex'>
                <span className='text-xs text-slate-500'>24h Change</span>
                <span className={`text-sm font-medium ${priceColor}`}>
                  {isUp ? '+' : ''}
                  {stats.priceChangePercent?.toFixed(2) || '0.00'}%
                </span>
              </div>

              <div className='hidden flex-col justify-center md:flex'>
                <span className='text-xs text-slate-500'>24h High</span>
                <span className='text-sm font-medium text-slate-200'>{formatCurrency(stats.high, 4)}</span>
              </div>

              <div className='hidden flex-col justify-center md:flex'>
                <span className='text-xs text-slate-500'>24h Low</span>
                <span className='text-sm font-medium text-slate-200'>{formatCurrency(stats.low, 4)}</span>
              </div>

              <div className='hidden flex-col justify-center lg:flex'>
                <span className='text-xs text-slate-500'>24h Vol(USDT)</span>
                <span className='text-sm font-medium text-emerald-400'>
                  {volumeData?.data
                    ? `$${formatVolume(volumeData.data.volume_quote_24h)}`
                    : formatCurrency(stats.volume, 0)}
                </span>
              </div>

              {volumeData?.data && (
                <div className='hidden flex-col justify-center lg:flex'>
                  <span className='text-xs text-slate-500'>24h Trades</span>
                  <span className='text-sm font-medium text-slate-200'>
                    {volumeData.data.trade_count_24h.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className='animate-pulse text-sm text-slate-500'>Loading market data...</div>
          )}
        </div>
      </div>

      {/* Right section: User actions & Connection */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1.5'>
          {connectionState === 'CONNECTED' ? (
            <WifiHighIcon size={16} weight='bold' className='text-green-500' />
          ) : (
            <WifiSlashIcon size={16} weight='bold' className='text-red-500' />
          )}
          <span className='text-xs font-medium text-slate-300'>
            {connectionState === 'CONNECTED' ? 'Realtime' : connectionState}
          </span>
        </div>
      </div>
    </div>
  )
}
