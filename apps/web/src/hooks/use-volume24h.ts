import { useQuery } from '@tanstack/react-query'
import type { Volume24hDetailResponse, Volume24hListResponse } from '@workspace/web/types/volume.types'

const API_BASE = '/api/v1'

interface UseVolume24hListOptions {
  sort_by?: 'symbol' | 'volume_quote_24h' | 'trade_count_24h' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
  enabled?: boolean
}

export function useVolume24hList(options: UseVolume24hListOptions = {}) {
  const { sort_by = 'volume_quote_24h', sort_order = 'desc', page = 1, limit = 50, enabled = true } = options

  const params = new URLSearchParams({
    sort_by,
    sort_order,
    page: String(page),
    limit: String(limit)
  })

  return useQuery<Volume24hListResponse>({
    queryKey: ['volume24h', 'list', sort_by, sort_order, page, limit],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/volume24h?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed to fetch volume24h: ${res.status}`)
      return res.json()
    },
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000
  })
}

export function useVolume24hBySymbol(symbol: string, enabled = true) {
  return useQuery<Volume24hDetailResponse>({
    queryKey: ['volume24h', 'detail', symbol],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/volume24h/${encodeURIComponent(symbol)}`)
      if (!res.ok) throw new Error(`Failed to fetch volume24h for ${symbol}: ${res.status}`)
      return res.json()
    },
    enabled: enabled && !!symbol,
    refetchInterval: 60_000,
    staleTime: 30_000
  })
}
