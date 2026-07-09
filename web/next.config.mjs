/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Gallery + hero images live in the same GCS bucket admin uploads to.
    // Allow the whole storage.googleapis.com host — the bucket path is
    // authored by admin, not user-generated content.
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
}

export default nextConfig
