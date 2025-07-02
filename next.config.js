/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  // Disable PWA temporarily for testing
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig
