/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Removed output: 'export' to enable API routes
  // For static deployment, API routes need serverless functions
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
