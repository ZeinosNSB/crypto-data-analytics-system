import { isProd } from '@workspace/api/config/env'
import pino from 'pino'

export const log = isProd
  ? pino({
      level: 'info',
      formatters: {
        level: label => ({ level: label })
      },
      timestamp: pino.stdTimeFunctions.isoTime
    })
  : pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: false,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,requestId,req,res,responseTime',
          messageFormat: '\x1b[33m[Crypto]\x1b[0m \x1b[32m{msg}\x1b[0m'
        }
      }
    })
