import * as repo from '@workspace/api/modules/volume24h/volume24h.repository'
import { log } from '@workspace/api/utils/log'
import type {
  Volume24hDocument,
  Volume24hListResponse,
  Volume24hQuery,
  Volume24hResponse
} from '@workspace/api/modules/volume24h/volume24h.types'
import type { Decimal128 } from 'mongodb'

const CACHE_TTL_MS = 30_000

interface CacheEntry {
  data: Volume24hListResponse
  expires_at: number
}

const listCache = new Map<string, CacheEntry>()

function cacheKey(query: Volume24hQuery): string {
  return `${query.exchange}:${query.symbol ?? 'ALL'}:${query.sort_by}:${query.sort_order}:${query.page}:${query.limit}`
}

function getFromCache(key: string): Volume24hListResponse | null {
  const entry = listCache.get(key)
  if (!entry) {
    return null
  }

  if (Date.now() > entry.expires_at) {
    listCache.delete(key)
    return null
  }

  return entry.data
}

function setCache(key: string, data: Volume24hListResponse): void {
  listCache.set(key, {
    data,
    expires_at: Date.now() + CACHE_TTL_MS
  })
}

function decimal128ToString(value: Decimal128 | undefined): string {
  return value?.toString() ?? '0'
}

function toResponse(doc: Volume24hDocument): Volume24hResponse {
  return {
    id: doc._id,
    exchange: doc.exchange,
    symbol: doc.symbol,
    window_start: doc.window_start.toISOString(),
    window_end: doc.window_end.toISOString(),
    volume_base_24h: decimal128ToString(doc.volume_base_24h),
    volume_quote_24h: decimal128ToString(doc.volume_quote_24h),
    trade_count_24h: doc.trade_count_24h,
    lookback_hours: doc.lookback_hours,
    computed_at: doc.computed_at.toISOString(),
    updated_at: doc.updated_at.toISOString()
  }
}

export async function getVolume24hList(query: Volume24hQuery): Promise<Volume24hListResponse> {
  const key = cacheKey(query)
  const cached = getFromCache(key)
  if (cached) {
    log.debug({ msg: `volume24h cache hit for ${key}` })
    return cached
  }

  const filter = {
    symbol: query.symbol,
    exchange: query.exchange ?? 'binance'
  }

  const sort = {
    field: query.sort_by ?? 'symbol',
    order: query.sort_order === 'asc' ? (1 as const) : (-1 as const)
  }

  const pagination = {
    page: query.page ?? 1,
    limit: query.limit ?? 20
  }

  const [docs, total] = await Promise.all([
    repo.findLatest(filter, sort, pagination),
    repo.countDistinctSymbols(filter)
  ])

  const response: Volume24hListResponse = {
    success: true,
    data: docs.map(toResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      total_pages: Math.ceil(total / pagination.limit) || 1
    }
  }

  setCache(key, response)
  return response
}

export async function getVolume24hBySymbol(symbol: string, exchange = 'binance'): Promise<Volume24hResponse | null> {
  const doc = await repo.findLatestBySymbol(symbol, exchange)
  return doc ? toResponse(doc) : null
}
