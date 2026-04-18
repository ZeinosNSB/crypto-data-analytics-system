import { createEnv } from '@t3-oss/env-core'
import * as v from 'valibot'

export const envConfig = createEnv({
  server: {},
  clientPrefix: 'NEXT_PUBLIC_',
  client: {
    NEXT_PUBLIC_URL: v.string(),
    NEXT_PUBLIC_API_ENDPOINT: v.string(),
    NEXT_PUBLIC_WEBSOCKET_ENDPOINT: v.string()
  },
  runtimeEnvStrict: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_WEBSOCKET_ENDPOINT: process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT
  }
})
