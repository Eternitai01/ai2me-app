import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd150d6hkhx9v8z.cloudfront.net',
      },
    ],
  },
  // Keep esbuild out of the bundle and `require()`d at runtime instead.
  //
  // The `webpack` hook below also externalizes it, but Turbopack never reads that hook —
  // so under `next dev --turbopack` esbuild was still traced, and @esbuild/win32-x64 is a
  // binary-only package (esbuild.exe + a README, no main/exports). The bundler walked into
  // the README and failed with "Unknown module type". This field is honored by both
  // bundlers, which is what makes /api/ai/preview/[sessionId] compile in dev.
  serverExternalPackages: ['esbuild'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "mammoth/lib/unzip.js": path.join(__dirname, "node_modules/mammoth/browser/unzip.js"),
        "mammoth/lib/docx/files.js": path.join(__dirname, "node_modules/mammoth/browser/docx/files.js"),
      };
      // Stub Node.js built-ins that some browser-compatible packages still reference
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        https: false,
        http: false,
        stream: false,
        zlib: false,
        buffer: false,
        crypto: false,
      };
    }
    // esbuild is a native Node.js CLI tool — must never be bundled by webpack.
    // It's only used in server-side API routes via child_process.
    config.externals = [...(config.externals || []), 'esbuild'];
    return config;
  },
  generateBuildId: async () => {
    // Use git commit SHA or timestamp for consistent build IDs across containers
    return process.env.BUILD_ID || process.env.GITHUB_SHA || `build-${Date.now()}`;
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Remove deprecated turbo config
  },
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ai2me.com',
          },
        ],
        destination: 'https://www.ai2me.com/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Ensure fresh HTML pages to pick up new JS bundles after deployment
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
        missing: [
          {
            type: 'header',
            key: 'x-nextjs-data',
          },
        ],
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*text/html.*)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
