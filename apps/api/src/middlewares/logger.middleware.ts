import { isProd } from '@workspace/api/config/env'
import { log as pinoLogger } from '@workspace/api/utils/log'
import Elysia from 'elysia'
import { StatusCodes } from 'http-status-codes'
import type { HTTPMethod } from 'elysia'

const METHOD_COLOR: Record<string, string> = {
  GET: '\x1b[32m',
  POST: '\x1b[33m',
  PUT: '\x1b[34m',
  PATCH: '\x1b[35m',
  DELETE: '\x1b[31m'
}
const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const METHOD_WIDTH = 6
const URL_WIDTH = 40
const STATUS_WIDTH = 3
const TIME_WIDTH = 7
const ID_WIDTH = 8

function colorize(color: string, text: string) {
  return `${color}${text}${RESET}`
}

function statusColor(status: number) {
  if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return '\x1b[31m'
  }
  if (status >= StatusCodes.BAD_REQUEST) {
    return '\x1b[33m'
  }
  return '\x1b[32m'
}

function pad(str: string, width: number) {
  if (str.length > width) {
    return str.slice(0, width - 1) + '…'
  }
  return str.padEnd(width)
}

function formatMethod(method: string) {
  const padded = method.padEnd(METHOD_WIDTH)
  const color = METHOD_COLOR[method] ?? '\x1b[37m'
  return colorize(color, padded)
}

function formatIncoming(method: string, url: string, requestId: string) {
  const col1 = colorize(DIM, '──▶')
  const col2 = ' '.repeat(STATUS_WIDTH)
  const col3 = formatMethod(method)
  const col4 = colorize(CYAN, pad(url, URL_WIDTH))
  const col5 = ' '.repeat(TIME_WIDTH)
  const col6 = colorize(DIM, requestId.slice(0, ID_WIDTH))
  return `${col1} ${col2} ${col3} ${col4} ${col5} ${col6}`
}

function formatCompleted(method: string, url: string, status: number, ms: number, requestId: string) {
  const sc = statusColor(status)
  const col1 = colorize(sc, '◀──')
  const col2 = colorize(sc, String(status).padEnd(STATUS_WIDTH))
  const col3 = formatMethod(method)
  const col4 = colorize(CYAN, pad(url, URL_WIDTH))
  const col5 = colorize(DIM, `+${ms}ms`.padStart(TIME_WIDTH))
  const col6 = colorize(DIM, requestId.slice(0, ID_WIDTH))
  return `${col1} ${col2} ${col3} ${col4} ${col5} ${col6}`
}

export interface LoggerOptions {
  methods?: Array<HTTPMethod>
}

export const logger = ({ methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }: LoggerOptions = {}) =>
  new Elysia({ name: 'logger' })
    .derive({ as: 'global' }, ({ request }) => ({
      start: Date.now(),
      requestId: request.headers.get('x-request-id') ?? crypto.randomUUID()
    }))
    .onBeforeHandle({ as: 'global' }, ({ request, path, requestId }) => {
      const method = request.method
      if (!methods.includes(method)) {
        return
      }

      if (isProd) {
        pinoLogger.info({
          requestId,
          req: {
            method,
            url: path,
            userAgent: request.headers.get('user-agent')
          },
          msg: 'Incoming request'
        })
      } else {
        pinoLogger.info({ msg: formatIncoming(method, path, requestId) })
      }
    })
    .onAfterHandle({ as: 'global' }, ({ request, path, set, start, requestId }) => {
      const method = request.method
      if (!methods.includes(method)) {
        return
      }

      const ms = Date.now() - start
      const status = (set.status as number) ?? 200

      if (isProd) {
        const payload = {
          requestId,
          req: { method, url: path },
          res: { status },
          responseTime: ms
        }
        if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
          pinoLogger.error({ ...payload, msg: 'Request failed' })
        } else if (status >= StatusCodes.BAD_REQUEST) {
          pinoLogger.warn({ ...payload, msg: 'Client error' })
        } else {
          pinoLogger.info({ ...payload, msg: 'Request completed' })
        }
      } else {
        const formatted = formatCompleted(method, path, status, ms, requestId)
        if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
          pinoLogger.error({ msg: formatted })
        } else if (status >= StatusCodes.BAD_REQUEST) {
          pinoLogger.warn({ msg: formatted })
        } else {
          pinoLogger.info({ msg: formatted })
        }
      }
    })
    .onError({ as: 'global' }, ({ request, path, set, error, start, requestId }) => {
      const method = request.method
      if (!methods.includes(method)) {
        return
      }

      const ms = start ? Date.now() - start : NaN
      const status = (set.status as number) ?? 500

      if (isProd) {
        pinoLogger.error({
          requestId,
          req: { method, url: path },
          res: { status },
          err: error,
          responseTime: ms,
          msg: 'Unhandled error'
        })
      } else {
        pinoLogger.error({
          msg: `\x1b[31m✖ UNHANDLED\x1b[0m ${formatMethod(method)} ${CYAN}${path}${RESET}`,
          err: error
        })
      }
    })
