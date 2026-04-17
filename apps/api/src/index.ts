import { Hono } from 'hono'

const app = new Hono().basePath('/api/v1')

export default {
  port: 4000,
  dleTimeout: 30,
  fetch: app.fetch
}
