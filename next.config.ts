import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', 'date-fns'],
  },
  // Allow dev server access from LAN devices (e.g. mobile testing at 10.88.x.x).
  // Without this, Next.js blocks cross-origin server action POSTs as CSRF,
  // which silently fails form submissions like sign-in.
  allowedDevOrigins: ['10.88.111.40', '10.0.0.94', '*.local'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
