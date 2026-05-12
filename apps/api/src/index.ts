import cors from '@elysiajs/cors'
import { envConfig, isProd } from '@workspace/api/config/env'
import { compression } from '@workspace/api/middlewares/compression.middleware'
import { logger } from '@workspace/api/middlewares/logger.middleware'
import {
  handleClientMessage,
  handleConnection,
  handleDisconnection,
  initWebSocketPubSub
} from '@workspace/api/modules/websocket/ws.handler'
import { log } from '@workspace/api/utils/log'
import { Elysia } from 'elysia'
import { helmet } from 'elysia-helmet'

initWebSocketPubSub()

const app = new Elysia({
  prefix: envConfig.PREFIX
})
  .use(logger())
  .use(helmet())
  .use(compression())
  .use(
    cors({
      origin: isProd ? envConfig.CLIENT_URL : [envConfig.CLIENT_URL, 'http://localhost:3000'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      maxAge: 60 * 60 * 24
    })
  )
  .get('/', () => 'Hello World!')
  .ws('/ws', {
    open(ws) {
      handleConnection(ws)
    },
    close(ws) {
      handleDisconnection(ws)
    },
    message(ws, data) {
      handleClientMessage(ws, data as Parameters<typeof handleClientMessage>[1])
    }
  })

app.listen(envConfig.PORT, server => {
  log.info(`Server is running on ${server.protocol}://${server.hostname}:${server.port}${envConfig.PREFIX}`)
})
