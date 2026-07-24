import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence Next.js 16 build error
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ["**/node_modules/**", "**/data/**"],
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'msypsrswdlvamjzgqgpg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      }
    ]
  },
};

export default nextConfig;
