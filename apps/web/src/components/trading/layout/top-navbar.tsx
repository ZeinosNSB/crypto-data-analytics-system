'use client'

import { WifiHighIcon, WifiSlashIcon } from '@phosphor-icons/react'
import { useVolume24hBySymbol } from '@workspace/web/hooks/use-volume24h'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { useMarketStore } from '@workspace/web/stores/market.store'
import { useWebsocketStore } from '@workspace/web/stores/websocket.store'
import { formatCurrency } from '@workspace/web/utils/chart'
import { formatVolume } from '@workspace/web/utils/format'
import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function TopNavbar() {
  const activeSymbol = useChartStore(state => state.activeSymbol)
  const candles = useChartStore(state => state.candles)
  const stats = useMarketStore(state => state.stats[activeSymbol])
  const connectionState = useWebsocketStore(state => state.connectionState)
  const { data: volumeData } = useVolume24hBySymbol(activeSymbol)
  const [isVolumeDetailsOpen, setIsVolumeDetailsOpen] = useState(false)

  useEffect(() => {
    setIsVolumeDetailsOpen(false)
  }, [activeSymbol])

  const recentPriceCandles = useMemo(() => {
    const recentCutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60

    return candles
      .filter(candle => Number(candle.time) >= recentCutoff)
      .slice(-6)
      .map(candle => ({
        time: candle.time,
        close: candle.close,
        volume: candle.volume
      }))
  }, [candles])

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

              <div className='relative hidden flex-col justify-center lg:flex'>
                <button
                  type='button'
                  onClick={() => setIsVolumeDetailsOpen(open => !open)}
                  className='text-left'
                  aria-expanded={isVolumeDetailsOpen}
                >
                  <span className='text-xs text-slate-500'>24h Vol(USDT)</span>
                  <span className='block text-sm font-medium text-emerald-400'>
                    {volumeData?.data
                      ? `$${formatVolume(volumeData.data.volume_quote_24h)}`
                      : formatCurrency(stats.volume, 0)}
                  </span>
              
                </button>

                {isVolumeDetailsOpen && volumeData?.data && (
                  <div className='absolute left-0 top-full z-20 mt-2 w-80 rounded-lg border border-slate-700 bg-[#131722] p-3 shadow-2xl shadow-black/40'>
                    <div className='mb-2 flex items-start justify-between gap-3 border-b border-slate-800 pb-2'>
                      <div>
                        <div className='text-xs uppercase tracking-wide text-slate-500'>24h Volume Details</div>
                        <div className='text-sm font-semibold text-slate-100'>{activeSymbol}</div>
                      </div>
                      <button
                        type='button'
                        onClick={() => setIsVolumeDetailsOpen(false)}
                        className='rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200'
                      >
                        Close
                      </button>
                    </div>

                    <div className='grid grid-cols-3 gap-2 border-b border-slate-800/60 pb-3'>
                      <div className='rounded-md border border-slate-800 bg-slate-950/40 px-2 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-slate-500'>24h Change</div>
                        <div className={`text-sm font-semibold ${priceColor}`}>
                          {isUp ? '+' : ''}
                          {stats.priceChangePercent?.toFixed(2) || '0.00'}%
                        </div>
                      </div>
                      <div className='rounded-md border border-slate-800 bg-slate-950/40 px-2 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-slate-500'>24h High</div>
                        <div className='text-sm font-semibold text-slate-100'>{formatCurrency(stats.high, 4)}</div>
                      </div>
                      <div className='rounded-md border border-slate-800 bg-slate-950/40 px-2 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-slate-500'>24h Low</div>
                        <div className='text-sm font-semibold text-slate-100'>{formatCurrency(stats.low, 4)}</div>
                      </div>
                    </div>

                    <div className='border-b border-slate-800/60 py-3'>
                      <div className='mb-2 text-[10px] uppercase tracking-wide text-slate-500'>Recent price history</div>
                      {recentPriceCandles.length > 0 ? (
                        <div className='max-h-32 space-y-1 overflow-auto pr-1'>
                          {recentPriceCandles.map(candle => (
                            <div key={String(candle.time)} className='flex items-center justify-between gap-4 rounded-md bg-slate-950/30 px-2 py-1.5'>
                              <span className='text-[11px] text-slate-500'>
                                {new Date(Number(candle.time) * 1000).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className='text-[11px] font-medium text-slate-100'>
                                Close {formatCurrency(candle.close, 4)}
                              </span>
                              <span className='text-[11px] text-slate-500'>Vol {formatVolume(String(candle.volume))}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='text-xs text-slate-600'>No recent candle history available yet.</div>
                      )}
                    </div>

                    <div className='space-y-1.5'>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Last price</span>
                        <span className={`text-sm font-medium ${priceColor}`}>{formatCurrency(stats.lastPrice, 4)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Quote volume</span>
                        <span className='text-sm text-emerald-400'>
                          ${formatVolume(volumeData.data.volume_quote_24h)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Exchange</span>
                        <span className='text-sm text-slate-100'>{volumeData.data.exchange.toUpperCase()}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Base volume</span>
                        <span className='text-sm text-slate-100'>{formatVolume(volumeData.data.volume_base_24h)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Trade count</span>
                        <span className='text-sm text-slate-100'>
                          {volumeData.data.trade_count_24h.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Lookback</span>
                        <span className='text-sm text-slate-100'>{volumeData.data.lookback_hours}h</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Updated</span>
                        <span className='text-sm text-slate-100'>{formatDateTime(volumeData.data.updated_at)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Computed at</span>
                        <span className='text-sm text-slate-100'>{formatDateTime(volumeData.data.computed_at)}</span>
                      </div>
                      <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
                        <span className='text-xs text-slate-500'>Window</span>
                        <span className='text-right text-sm text-slate-100'>
                          {formatDateTime(volumeData.data.window_start)}
                          <br />
                          {formatDateTime(volumeData.data.window_end)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
