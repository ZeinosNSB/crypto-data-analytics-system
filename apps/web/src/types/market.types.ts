import type { Time } from 'lightweight-charts'

export interface MarketEvent {
  schema_version: number
  exchange: 'binance' | string
  event_type: 'trade' | 'book_ticker' | 'kline'
  symbol: string
  event_time: number
  ingest_time: number
  price: string
  quantity: string
  source: string
}

export interface TradeEvent extends MarketEvent {
  event_type: 'trade'
  trade_id: number | string | null
  is_buyer_maker: boolean | null
}

export interface OhlcCandlePayload {
  schema_version: number
  type: 'ohlc_candle'
  status: 'partial' | 'closed'
  exchange: string
  symbol: string
  interval: string
  bucket_start: number
  bucket_end: number
  first_event_time: number
  last_event_time: number
  trade_count: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  source: string
  emitted_at: number
}

export interface PriceAlert {
  schema_version: number
  type: 'price_alert'
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  exchange: string
  symbol: string
  interval: string
  bucket_start: number
  bucket_end: number
  open: string
  close: string
  change_abs: string
  change_pct: string
  direction: 'up' | 'down' | 'flat'
  threshold_pct: string
  trade_count: number
  source: string
  message: string
  created_at: number
}

export interface CandleData {
  time: Time // typically unix timestamp in seconds for lightweight-charts
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface WatchlistSymbol {
  symbol: string
  lastPrice: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  sparkline: Array<number> // For mini chart
}

export interface MarketStats {
  symbol: string
  lastPrice: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
  quoteVolume: number
}
