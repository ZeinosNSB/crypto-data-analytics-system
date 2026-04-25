import { brotliCompressSync } from 'node:zlib'
import { deflateSync, gzipSync, zstdCompressSync } from 'bun'
import { Elysia } from 'elysia'

const compressors = {
  br: (buffer: Buffer) => brotliCompressSync(buffer),
  gzip: (buffer: Buffer) => gzipSync(new Uint8Array(buffer)),
  deflate: (buffer: Buffer) => deflateSync(new Uint8Array(buffer)),
  zstd: (buffer: Buffer) => zstdCompressSync(buffer)
}

function isValidEncoding(encoding: string): encoding is keyof typeof compressors {
  return Object.keys(compressors).includes(encoding)
}

export const compression = (
  options = {
    encodings: ['br', 'gzip', 'deflate', 'zstd'],
    log: false,
    threshold: 1024
  }
) => {
  const app = new Elysia({ name: 'elysia-compress' }).onAfterHandle(ctx => {
    const clientEncodings = ctx.headers['accept-encoding']?.split(', ') || []
    const encoding = options.encodings.find(enc => clientEncodings.includes(enc))
    if (!encoding || !isValidEncoding(encoding)) {
      return ctx.responseValue
    }

    const buffer = Buffer.from(JSON.stringify(ctx.responseValue))
    const originalSize = buffer.length
    if (originalSize < options.threshold) {
      return ctx.responseValue
    }
    ctx.set.headers['Content-Encoding'] = encoding
    ctx.set.headers['Content-Type'] = ctx.headers['content-type'] || 'application/json'
    const startTime = options.log ? performance.now() : 0
    const compressed = compressors[encoding](buffer)
    const endTime = options.log ? performance.now() : 0
    const compressionTime = options.log ? endTime - startTime : 0
    const compressedSize = compressed.length
    const compressionRatio = options.log ? ((originalSize - compressedSize) / originalSize) * 100 : 0
    const sizeReduction = options.log ? originalSize - compressedSize : 0
    if (options.log) {
      console.log(`[Compression Stats] ${encoding.toUpperCase()}:`, {
        encoding,
        originalSize: `${originalSize} bytes (${(originalSize / 1024).toFixed(2)} KB)`,
        compressedSize: `${compressedSize} bytes (${(compressedSize / 1024).toFixed(2)} KB)`,
        sizeReduction: `${sizeReduction} bytes (${(sizeReduction / 1024).toFixed(2)} KB)`,
        compressionRatio: `${compressionRatio.toFixed(2)}%`,
        compressionTime: `${compressionTime.toFixed(2)}ms`
      })
    }
    return compressed
  })
  return app.as('scoped')
}
