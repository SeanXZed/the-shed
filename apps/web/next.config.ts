import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@the-shed/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
