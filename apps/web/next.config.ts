import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  typescript: {
    // TODO: pre-existing type errors in src/components & src/app pages need fixing.
    // Set back to `false` once `yarn typecheck` is clean.
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: re-enable after lint cleanup
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${api}/api/:path*`,
      },
    ];
  },
};

export default config;
