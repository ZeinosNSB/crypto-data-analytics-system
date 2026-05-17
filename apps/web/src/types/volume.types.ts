export interface Volume24hItem {
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

export interface Volume24hPagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface Volume24hListResponse {
  success: true
  data: Array<Volume24hItem>
  pagination: Volume24hPagination
}

export interface Volume24hDetailResponse {
  success: true
  data: Volume24hItem
}
