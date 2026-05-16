'use client'

import { useChartStore } from '@workspace/web/stores/chart.store'
import { ColorType } from 'lightweight-charts'
import { CandlestickSeries, Chart, HistogramSeries, Pane, PriceScale } from 'lightweight-charts-react-components'
import React, { useEffect, useMemo, useRef, useState } from 'react'

class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const candles = useChartStore(state => state.candles)
  const activeSymbol = useChartStore(state => state.activeSymbol)

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const normalizedCandles = useMemo(() => {
    const sortedCandles = [...candles].sort((left, right) => Number(left.time) - Number(right.time))
    const dedupedCandles = [] as typeof sortedCandles

    for (const candle of sortedCandles) {
      const lastCandle = dedupedCandles[dedupedCandles.length - 1]

      if (lastCandle && lastCandle.time === candle.time) {
        dedupedCandles[dedupedCandles.length - 1] = candle
      } else {
        dedupedCandles.push(candle)
      }
    }

    return dedupedCandles
  }, [candles])

  const visibleCandles = useMemo(() => {
    if (normalizedCandles.length === 0) {
      return normalizedCandles
    }

    const recentCutoff = Math.floor(Date.now() / 1000) - 24 * 60 * 60
    const recentCandles = normalizedCandles.filter(candle => Number(candle.time) >= recentCutoff)

    return recentCandles.length > 0 ? recentCandles : normalizedCandles
  }, [normalizedCandles])

  // Format data for lightweight-charts
  const chartData = useMemo(() => {
    return visibleCandles.map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }))
  }, [visibleCandles])

  const volumeData = useMemo(() => {
    return visibleCandles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    }))
  }, [visibleCandles])

  return (
    <div ref={containerRef} className='absolute inset-0'>
      <ChartErrorBoundary
        fallback={
          <div className='flex h-full items-center justify-center rounded border border-slate-800 bg-[#131722] text-sm text-slate-500'>
            Chart unavailable while market data stabilizes.
          </div>
        }
      >
        <Chart
          options={{
            width: dimensions.width,
            height: dimensions.height,
            layout: {
              background: { type: ColorType.Solid, color: '#131722' },
              textColor: '#94a3b8'
            },
            grid: {
              vertLines: { color: '#1e222d' },
              horzLines: { color: '#1e222d' }
            },
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: '#1e222d'
            },
            rightPriceScale: {
              borderColor: '#1e222d'
            },
            crosshair: {
              mode: 1,
              vertLine: {
                color: '#334155',
                width: 1,
                style: 3,
                labelBackgroundColor: '#1e293b'
              },
              horzLine: {
                color: '#334155',
                width: 1,
                style: 3,
                labelBackgroundColor: '#1e293b'
              }
            }
          }}
        >
          <Pane>
            <CandlestickSeries
              data={chartData}
              options={{
                upColor: '#22c55e',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#22c55e',
                wickDownColor: '#ef4444'
              }}
            />
            <HistogramSeries
              data={volumeData}
              options={{
                priceFormat: { type: 'volume' },
                priceScaleId: ''
              }}
            />
            <PriceScale
              id=''
              options={{
                scaleMargins: {
                  top: 0.8,
                  bottom: 0
                }
              }}
            />
          </Pane>
        </Chart>
      </ChartErrorBoundary>

      {/* Loading state when no candles */}
      {visibleCandles.length === 0 && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='flex flex-col items-center gap-3'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
            <span className='text-sm text-slate-500'>Waiting for {activeSymbol} data...</span>
          </div>
        </div>
      )}

      {/* Watermark Logo */}
      <div className='pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center opacity-[0.03]'>
        <div className='flex h-32 w-32 items-center justify-center rounded bg-gradient-to-tr from-blue-600 to-cyan-500 text-6xl font-bold text-white'>
          A
        </div>
      </div>
    </div>
  )
}
