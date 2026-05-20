/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile shared packages from the monorepo so Next can bundle them.
  transpilePackages: ['@guide-me-app/core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
