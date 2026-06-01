import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';
import { getImageKitUrlHostname } from './lib/imagekit/config';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const imageKitHost = getImageKitUrlHostname();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  typescript:{
    ignoreBuildErrors:true
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      ...(imageKitHost && imageKitHost !== 'ik.imagekit.io'
        ? [{ protocol: 'https' as const, hostname: imageKitHost }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  poweredByHeader: false,
};

export default nextConfig;
