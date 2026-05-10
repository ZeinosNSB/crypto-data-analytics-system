//@ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: false,
  reactCompiler: false,
  output: 'standalone',
  cacheComponents: true,
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'thesvg.org'
      }
    ]
  },
  // Keep config framework-agnostic for CI stability.
}
module.exports = nextConfig
