import { envConfig } from '@workspace/api/config/env'
import { log } from '@workspace/api/utils/log'
import { Redis } from 'ioredis'

const redis = new Redis(envConfig.REDIS_URL, {
  connectTimeout: 10000,
  maxRetriesPerRequest: 10,
  enableOfflineQueue: true,
  enableAutoPipelining: true,
  tls: envConfig.REDIS_URL.startsWith('rediss://') ? {} : undefined
})

redis.on('connect', () => {
  log.info({ msg: 'Redis connected and ready' })
})

redis.on('close', (error?: Error) => {
  if (error) {
    log.error({ err: error, msg: 'Redis connection closed with error' })
  } else {
    log.warn({ msg: 'Redis connection closed' })
  }
})

export const redisPubSub = new Redis(envConfig.REDIS_URL, {
  connectTimeout: 10000,
  maxRetriesPerRequest: 10,
  enableOfflineQueue: true,
  enableAutoPipelining: true,
  tls: envConfig.REDIS_URL.startsWith('rediss://') ? {} : undefined
})

redisPubSub.on('connect', () => {
  log.info({ msg: 'Redis PubSub connected and ready' })
})

redisPubSub.on('close', (error?: Error) => {
  if (error) {
    log.error({ err: error, msg: 'Redis PubSub connection closed with error' })
  } else {
    log.warn({ msg: 'Redis PubSub connection closed' })
  }
})

process.on('SIGTERM', () => {
  log.info({ msg: 'SIGTERM received, closing Redis connections...' })
  redis.quit()
  redisPubSub.quit()
})

export default redis
