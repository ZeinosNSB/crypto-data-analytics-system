'use client'

import { WifiHighIcon, WifiSlashIcon } from '@phosphor-icons/react'
import { useMarketWebsocket } from '@workspace/web/hooks/use-market-websocket'
import { useWatchlistStore } from '@workspace/web/stores/watchlist.store'
import { useWebsocketStore } from '@workspace/web/stores/websocket.store'
import { formatCurrency } from '@workspace/web/utils/chart'
import { motion } from 'motion/react'

const trackedSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']

function formatChange(value: number) {
  const prefix = value >= 0 ? '+' : ''
  const precision = Math.abs(value) < 0.01 ? 4 : 2
  return `${prefix}${value.toFixed(precision)}%`
}

export function LivePrices() {
  useMarketWebsocket()

  const symbols = useWatchlistStore(state => state.symbols)
  const connectionState = useWebsocketStore(state => state.connectionState)

  const tracked = trackedSymbols
    .map(symbol => symbols.find(item => item.symbol === symbol))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const hasLivePrice = tracked.some(item => item.lastPrice > 0)
  const isConnected = connectionState === 'CONNECTED'

  return (
    <section className='mx-auto max-w-7xl px-6 pb-24'>
      <div className='border-border bg-card/60 relative overflow-hidden rounded-[28px] border p-6 backdrop-blur md:p-8'>
        <div className='bg-gradient-hero pointer-events-none absolute inset-0 opacity-80' />
        <div className='relative flex flex-col gap-6'>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <div className='text-accent mb-3 text-xs font-semibold tracking-[0.25em] uppercase'>
                Live market prices
              </div>
              <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
                Giá coin cập nhật trực tiếp từ <span className='text-gradient-primary'>Kafka → Redis → Web</span>
              </h2>
              <p className='text-muted-foreground mt-3 max-w-2xl'>
                Trang chủ đang nghe cùng một luồng realtime với dashboard, nên các mức giá dưới đây phản ánh dữ liệu
                trade mới nhất của 5 cặp giao dịch chính.
              </p>
            </div>

            <div className='flex items-center gap-2 self-start rounded-full border border-slate-700/60 bg-slate-950/40 px-3 py-1.5'>
              {isConnected ? (
                <WifiHighIcon size={16} weight='bold' className='text-green-500' />
              ) : (
                <WifiSlashIcon size={16} weight='bold' className='text-red-500' />
              )}
              <span className='text-xs font-medium text-slate-300'>
                {isConnected ? 'Realtime connected' : connectionState}
              </span>
            </div>
          </div>

          <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-5'>
            {tracked.map(item => {
              const changeUp = item.changePercent24h >= 0
              const borderClass = changeUp ? 'border-emerald-500/30' : 'border-rose-500/30'
              const accentClass = changeUp ? 'text-emerald-400' : 'text-rose-400'
              const bgClass = changeUp ? 'bg-emerald-500/10' : 'bg-rose-500/10'

              return (
                <motion.div
                  key={item.symbol}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                  className={`rounded-2xl border ${borderClass} bg-[#0f1116]/80 p-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]`}
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <div className='text-lg font-semibold text-slate-100'>{item.symbol}</div>
                      <div className='text-xs text-slate-500'>Live spot price</div>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${bgClass} ${accentClass}`}>
                      {formatChange(item.changePercent24h)}
                    </div>
                  </div>

                  <div className='mt-4 text-2xl font-bold tracking-tight text-slate-50'>
                    {item.lastPrice > 0 ? formatCurrency(item.lastPrice, item.lastPrice < 10 ? 4 : 2) : '—'}
                  </div>

                  <div className='mt-2 text-xs text-slate-500'>
                    {item.lastPrice > 0 ? `Δ ${formatCurrency(item.priceChange, item.priceChange < 1 ? 4 : 2)}` : 'Waiting for first trade...'}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {!hasLivePrice && (
            <div className='text-muted-foreground text-sm'>
              Chưa có giá mới đổ về. Hãy kiểm tra ingestion và streaming nếu trạng thái này kéo dài.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
