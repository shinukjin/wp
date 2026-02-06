/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_APP_URL ? `${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/api` : 'http://localhost:3000/api'),
  },
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서 Node.js 모듈을 사용하지 않도록 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

