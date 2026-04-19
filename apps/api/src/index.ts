import { envConfig } from '@workspace/api/config/env'
import { compression } from '@workspace/api/middlewares/compression.middleware'
import { logger } from '@workspace/api/middlewares/logger.middleware'
import { log } from '@workspace/api/utils/log'
import Elysia from 'elysia'
import { helmet } from 'elysia-helmet'

const app = new Elysia({
  prefix: envConfig.PREFIX
})
  .use(logger())
  .use(helmet())
  .use(compression())
  .get('/', () => 'Hello World!')

app.listen(envConfig.PORT, server => {
  log.info(`Server is running on ${server.protocol}://${server.hostname}:${server.port}${envConfig.PREFIX}`)
})
