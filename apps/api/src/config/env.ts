import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const envConfig = createEnv({
  server: {
    PORT: v.optional(v.string(), '4000'),
    PREFIX: v.string(),
    PRODUCTION: v.pipe(
      v.picklist(['true', 'false']),
      v.transform(value => value === 'true')
    ),
    CLIENT_URL: v.string()
  },
  runtimeEnv: process.env
})

export const isProd = envConfig.PRODUCTION
