import type { Decimal128 } from 'mongodb'

export interface Volume24hDocument {
  _id: string
  exchange: string
  symbol: string
  metric: string
  window_start: Date
  window_end: Date
  volume_base_24h: Decimal128
  volume_quote_24h: Decimal128
  trade_count_24h: number
  first_event_timestamp: Date
  last_event_timestamp: Date
  lookback_hours: number
  computed_at: Date
  updated_at: Date
  created_at?: Date
}

export interface Volume24hResponse {
  id: string
  exchange: string
  symbol: string
  window_start: string
  window_end: string
  volume_base_24h: string
  volume_quote_24h: string
  trade_count_24h: number
  lookback_hours: number
  computed_at: string
  updated_at: string
}

export interface Volume24hListResponse {
  success: true
  data: Array<Volume24hResponse>
  pagination: PaginationMeta
}

export interface Volume24hDetailResponse {
  success: true
  data: Volume24hResponse
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface Volume24hQuery {
  symbol?: string
  exchange?: string
  sort_by?: 'symbol' | 'volume_quote_24h' | 'trade_count_24h' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface Volume24hFilter {
  symbol?: string
  exchange: string
}

export interface Volume24hSort {
  field: string
  order: 1 | -1
}

export interface Volume24hPagination {
  page: number
  limit: number
}
