import { getDb } from '@workspace/api/libs/mongo'
import type {
  Volume24hDocument,
  Volume24hFilter,
  Volume24hPagination,
  Volume24hSort
} from '@workspace/api/modules/volume24h/volume24h.types'
import type { Sort } from 'mongodb'

const COLLECTION_NAME = 'volume_24h'

function collection() {
  return getDb().collection<Volume24hDocument>(COLLECTION_NAME)
}

function buildFilter(filter: Volume24hFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {
    metric: 'volume_24h',
    exchange: filter.exchange
  }

  if (filter.symbol) {
    query.symbol = filter.symbol
  }

  return query
}

function buildSort(sort: Volume24hSort): Sort {
  const fieldMap: Record<string, string> = {
    symbol: 'symbol',
    volume_quote_24h: 'volume_quote_24h',
    trade_count_24h: 'trade_count_24h',
    updated_at: 'updated_at'
  }

  const mongoField = fieldMap[sort.field] ?? 'symbol'
  return { [mongoField]: sort.order }
}

export async function findLatest(
  filter: Volume24hFilter,
  sort: Volume24hSort,
  pagination: Volume24hPagination
): Promise<Array<Volume24hDocument>> {
  const skip = (pagination.page - 1) * pagination.limit

  const pipeline = [
    { $match: buildFilter(filter) },
    { $sort: { symbol: 1 as const, window_end: -1 as const } },
    {
      $group: {
        _id: '$symbol',
        doc: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: buildSort(sort) },
    { $skip: skip },
    { $limit: pagination.limit }
  ]

  return collection().aggregate<Volume24hDocument>(pipeline).toArray()
}

export async function countDistinctSymbols(filter: Volume24hFilter): Promise<number> {
  const pipeline = [
    { $match: buildFilter(filter) },
    {
      $group: {
        _id: '$symbol'
      }
    },
    { $count: 'total' }
  ]

  const result = await collection().aggregate<{ total: number }>(pipeline).toArray()

  return result[0]?.total ?? 0
}

export async function findLatestBySymbol(symbol: string, exchange = 'binance'): Promise<Volume24hDocument | null> {
  return collection().findOne({ metric: 'volume_24h', exchange, symbol }, { sort: { window_end: -1 } })
}
