import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow dev server access from LAN devices (e.g. mobile testing at 10.88.x.x).
  // Without this, Next.js blocks cross-origin server action POSTs as CSRF,
  // which silently fails form submissions like sign-in.
  allowedDevOrigins: ['10.88.111.40', '*.local'],
};

export default nextConfig;
