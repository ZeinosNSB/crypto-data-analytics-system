import { isMongoHealthy } from '@workspace/api/libs/mongo'
import * as service from '@workspace/api/modules/volume24h/volume24h.service'
import { log } from '@workspace/api/utils/log'
import { Elysia, t } from 'elysia'

function errorHandler() {
  return new Elysia({ name: 'volume24h-error-handler' }).onError({ as: 'scoped' }, ({ code, error, status }) => {
    if (code === 'VALIDATION') {
      return status(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      })
    }

    if (code === 'NOT_FOUND') {
      return status(404, {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      })
    }

    log.error({ err: error, msg: 'Unhandled error in volume24h' })
    return status(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    })
  })
}

export const volume24hRoutes = () =>
  new Elysia({ name: 'volume24h', prefix: '/volume24h' })
    .use(errorHandler())

    .get(
      '/',
      async ({ query }) => {
        return service.getVolume24hList(query)
      },
      {
        query: t.Object({
          symbol: t.Optional(
            t.String({
              pattern: '^[A-Za-z0-9]{3,20}$',
              error: 'symbol must be 3-20 alphanumeric characters'
            })
          ),
          exchange: t.Optional(t.String({ default: 'binance' })),
          sort_by: t.Optional(
            t.Union(
              [
                t.Literal('symbol'),
                t.Literal('volume_quote_24h'),
                t.Literal('trade_count_24h'),
                t.Literal('updated_at')
              ],
              {
                default: 'symbol',
                error: 'sort_by must be one of: symbol, volume_quote_24h, trade_count_24h, updated_at'
              }
            )
          ),
          sort_order: t.Optional(
            t.Union([t.Literal('asc'), t.Literal('desc')], {
              default: 'desc',
              error: 'sort_order must be asc or desc'
            })
          ),
          page: t.Optional(t.Numeric({ minimum: 1, default: 1, error: 'page must be a positive integer' })),
          limit: t.Optional(
            t.Numeric({
              minimum: 1,
              maximum: 100,
              default: 20,
              error: 'limit must be between 1 and 100'
            })
          )
        })
      }
    )

    .get(
      '/:symbol',
      async ({ params, status }) => {
        const symbol = params.symbol.toUpperCase()
        const data = await service.getVolume24hBySymbol(symbol)

        if (!data) {
          return status(404, {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Volume data not found for symbol ${symbol}`
            }
          })
        }

        return { success: true, data }
      },
      {
        params: t.Object({
          symbol: t.String({
            pattern: '^[A-Za-z0-9]{3,20}$',
            error: 'symbol must be 3-20 alphanumeric characters'
          })
        })
      }
    )

export const mongoHealthRoute = () =>
  new Elysia({ name: 'mongo-health', prefix: '/health' }).get('/mongo', async ({ status }) => {
    const healthy = await isMongoHealthy()

    if (!healthy) {
      return status(503, { status: 'unhealthy', service: 'mongodb' })
    }

    return { status: 'ok', service: 'mongodb' }
  })
