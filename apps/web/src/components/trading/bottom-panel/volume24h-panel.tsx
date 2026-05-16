'use client'

import { ArrowRightIcon, CaretDownIcon, CaretUpDownIcon, CaretUpIcon } from '@phosphor-icons/react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/web/components/ui/table'
import { useVolume24hBySymbol, useVolume24hList } from '@workspace/web/hooks/use-volume24h'
import { useChartStore } from '@workspace/web/stores/chart.store'
import { formatTradeCount, formatVolume } from '@workspace/web/utils/format'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import React, { useMemo, useState } from 'react'
import type { SortingState } from '@tanstack/react-table'
import type { Volume24hItem } from '@workspace/web/types/volume.types'

dayjs.extend(relativeTime)

const columnHelper = createColumnHelper<Volume24hItem>()

function useColumns() {
  return useMemo(
    () => [
      columnHelper.display({
        id: 'index',
        header: '#',
        cell: info => <span className='text-slate-600'>{info.row.index + 1}</span>,
        size: 40
      }),
      columnHelper.accessor('symbol', {
        header: 'Symbol',
        cell: info => (
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-slate-200'>{info.getValue()}</span>
            <span className='rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase'>
              {info.row.original.exchange}
            </span>
          </div>
        )
      }),
      columnHelper.accessor('volume_quote_24h', {
        header: 'Volume (USDT)',
        cell: info => <span className='font-mono font-medium text-emerald-400'>${formatVolume(info.getValue())}</span>,
        sortingFn: (a, b) => parseFloat(a.original.volume_quote_24h) - parseFloat(b.original.volume_quote_24h)
      }),
      columnHelper.accessor('trade_count_24h', {
        header: 'Trades',
        cell: info => <span className='font-mono text-slate-300'>{formatTradeCount(info.getValue())}</span>
      }),
      columnHelper.accessor('volume_base_24h', {
        header: 'Vol Base',
        cell: info => <span className='font-mono text-slate-400'>{formatVolume(info.getValue())}</span>,
        sortingFn: (a, b) => parseFloat(a.original.volume_base_24h) - parseFloat(b.original.volume_base_24h)
      }),
      columnHelper.accessor('updated_at', {
        header: 'Updated',
        cell: info => <span className='text-slate-500'>{dayjs(info.getValue()).fromNow()}</span>
      }),
      columnHelper.display({
        id: 'window',
        header: 'Window',
        cell: info => (
          <span className='inline-flex items-center gap-1 text-[10px] text-slate-600'>
            <span>{dayjs(info.row.original.window_start).format('HH:mm')}</span>

            <ArrowRightIcon size={10} weight='bold' />

            <span>{dayjs(info.row.original.window_end).format('HH:mm')}</span>
          </span>
        )
      })
    ],
    []
  )
}

function SortIndicator({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (!direction) return <CaretUpDownIcon size={14} className='ml-0.5 inline text-slate-700' />
  return direction === 'asc' ? (
    <CaretUpIcon size={14} weight='bold' className='ml-0.5 inline text-blue-400' />
  ) : (
    <CaretDownIcon size={14} weight='bold' className='ml-0.5 inline text-blue-400' />
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-4 border-b border-slate-800/60 py-2 last:border-b-0'>
      <span className='text-xs text-slate-500'>{label}</span>
      <span className='text-sm text-slate-100'>{value}</span>
    </div>
  )
}

export function Volume24hPanel() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'volume_quote_24h', desc: true }])
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  const setActiveSymbol = useChartStore(state => state.setActiveSymbol)
  const activeSymbol = useChartStore(state => state.activeSymbol)

  const {
    data: selectedVolume,
    isLoading: isSelectedLoading,
    isError: isSelectedError
  } = useVolume24hBySymbol(selectedSymbol ?? '', Boolean(selectedSymbol))

  const {
    data: response,
    isLoading,
    isError
  } = useVolume24hList({
    sort_by: 'volume_quote_24h',
    sort_order: 'desc',
    limit: 50
  })

  const columns = useColumns()

  const table = useReactTable({
    data: response?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-slate-500'>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
          Loading volume data...
        </div>
      </div>
    )
  }

  if (isError || !response) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-slate-500'>
        <div className='flex flex-col items-center gap-2'>
          <span className='text-red-400'>Failed to load volume data</span>
          <span className='text-xs text-slate-600'>Make sure the API is running and MongoDB has data</span>
        </div>
      </div>
    )
  }

  if (response.data.length === 0) {
    return (
      <div className='flex h-full items-center justify-center text-sm text-slate-500'>
        <div className='flex flex-col items-center gap-2'>
          <span>No volume data available</span>
          <span className='text-xs text-slate-600'>Run the PySpark batch job to populate data</span>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b border-slate-800/50 bg-[#0f1116] px-4 py-3'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <div className='text-xs uppercase tracking-wide text-slate-500'>24h volume</div>
            <div className='text-sm text-slate-400'>Click a row to show details</div>
          </div>
          {selectedSymbol && (
            <button
              type='button'
              onClick={() => setSelectedSymbol(null)}
              className='rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200'
            >
              Hide details
            </button>
          )}
        </div>

        {selectedSymbol && (
          <div className='mt-3 rounded-lg border border-slate-800/80 bg-[#131722] px-4'>
            {isSelectedLoading ? (
              <div className='py-4 text-sm text-slate-500'>Loading symbol details...</div>
            ) : isSelectedError || !selectedVolume?.data ? (
              <div className='py-4 text-sm text-slate-500'>No detail available for this symbol.</div>
            ) : (
              <div className='grid gap-2 py-2 md:grid-cols-2'>
                <DetailRow label='Symbol' value={selectedVolume.data.symbol} />
                <DetailRow label='Exchange' value={selectedVolume.data.exchange.toUpperCase()} />
                <DetailRow label='Lookback' value={`${selectedVolume.data.lookback_hours}h`} />
                <DetailRow label='Volume (USDT)' value={`$${formatVolume(selectedVolume.data.volume_quote_24h)}`} />
                <DetailRow label='Base volume' value={formatVolume(selectedVolume.data.volume_base_24h)} />
                <DetailRow label='Trade count' value={formatTradeCount(selectedVolume.data.trade_count_24h)} />
                <DetailRow label='Updated' value={dayjs(selectedVolume.data.updated_at).fromNow()} />
                <DetailRow label='Window start' value={dayjs(selectedVolume.data.window_start).format('YYYY-MM-DD HH:mm:ss')} />
                <DetailRow label='Window end' value={dayjs(selectedVolume.data.window_end).format('YYYY-MM-DD HH:mm:ss')} />
                <DetailRow label='Computed at' value={dayjs(selectedVolume.data.computed_at).format('YYYY-MM-DD HH:mm:ss')} />
                <DetailRow
                  label='Record ID'
                  value={<span className='font-mono text-[11px] text-slate-400'>{selectedVolume.data.id}</span>}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className='flex-1 overflow-auto'>
        <Table>
          <TableHeader className='sticky top-0 z-10 bg-[#0f1116]'>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='border-slate-800/50 hover:bg-transparent'>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className='cursor-pointer text-slate-500 transition-colors select-none hover:text-slate-300'
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <SortIndicator direction={header.column.getIsSorted()} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => {
              const isActive = row.original.symbol === activeSymbol

              return (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    setActiveSymbol(row.original.symbol)
                    setSelectedSymbol(row.original.symbol)
                  }}
                  className={`cursor-pointer border-slate-800/30 ${
                    isActive ? 'bg-blue-500/5 text-slate-100' : 'text-slate-300'
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between border-t border-slate-800 px-4 py-1.5 text-xs text-slate-600'>
        <span>
          Showing {response.data.length} of {response.pagination.total} symbols
        </span>
        <span>Updated from batch pipeline · Refreshes every 60s</span>
      </div>
    </div>
  )
}
