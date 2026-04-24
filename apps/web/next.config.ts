import type { NextConfig } from 'next';

// Browser code can only read NEXT_PUBLIC_* from process.env at build time.
// Map unprefixed Supabase vars (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) so .env.local
// can omit NEXT_PUBLIC_* for the public URL + publishable key. Never map secrets here.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      '',
  },
  async redirects() {
    return [{ source: '/learn', destination: '/track', permanent: true }]
  },
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
