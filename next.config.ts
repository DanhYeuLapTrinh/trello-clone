import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'lurlene-chondriosomal-arnulfo.ngrok-free.app',
    '*.ngrok-free.app',
    '*.ngrok.io',
    'localhost',
    '127.0.0.1'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
