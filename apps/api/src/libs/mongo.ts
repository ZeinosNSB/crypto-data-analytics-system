import { envConfig } from '@workspace/api/config/env'
import { log } from '@workspace/api/utils/log'
import { MongoClient } from 'mongodb'
import type { Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

function createClient(): MongoClient {
  return new MongoClient(envConfig.MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30_000,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    connectTimeoutMS: 10_000,
    retryWrites: true,
    retryReads: true,
    compressors: ['zstd', 'snappy']
  })
}

export async function initMongo(): Promise<Db> {
  if (db) {
    return db
  }

  client = createClient()

  client.on('connectionPoolCreated', () => {
    log.info({ msg: 'MongoDB connection pool created' })
  })

  client.on('connectionPoolClosed', () => {
    log.warn({ msg: 'MongoDB connection pool closed' })
  })

  await client.connect()
  const database = client.db()
  await database.command({ ping: 1 })

  db = database
  log.info({ msg: `MongoDB connected to database "${database.databaseName}"` })

  await ensureIndexes(database)

  return database
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    log.info({ msg: 'MongoDB connection closed' })
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('MongoDB is not initialized. Call initMongo() first.')
  }
  return db
}

export async function isMongoHealthy(): Promise<boolean> {
  if (!db) {
    return false
  }

  try {
    const result = await db.command({ ping: 1 })
    return result.ok === 1
  } catch {
    return false
  }
}

async function ensureIndexes(database: Db): Promise<void> {
  const volume24h = database.collection('volume_24h')

  await volume24h.createIndex({ metric: 1, exchange: 1, symbol: 1, window_end: -1 }, { name: 'volume_24h_lookup' })

  await volume24h.createIndex({ computed_at: -1 }, { name: 'volume_24h_computed_at' })

  log.info({ msg: 'MongoDB indexes ensured for volume_24h' })
}

process.on('SIGTERM', async () => {
  log.info({ msg: 'SIGTERM received, closing MongoDB connection...' })
  await closeMongo()
})
