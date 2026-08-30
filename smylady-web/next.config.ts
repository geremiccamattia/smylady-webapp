import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/blog/:path*',
        destination: 'https://blog.shareyourparty.de/:path*',
      },
    ]
  },
  /**
   * Umbenennung Influencer Club → Creator Club (August 2026).
   *
   * Die alten URLs stehen in Instagram-Posts, versendeten E-Mails und im
   * Google-Index und müssen erreichbar bleiben. `permanent: true` erzeugt in
   * Next.js einen 308, damit die Methode erhalten bleibt und Suchmaschinen die
   * Adresse dauerhaft übernehmen.
   *
   * Je Route braucht es zwei Einträge: Die Sprachen laufen in diesem Projekt über
   * echte Verzeichnisse (src/app/en/(app)/…) und nicht über eine i18n-Middleware,
   * deshalb greift eine Regel für "/…" nicht automatisch auch für "/en/…".
   */
  async redirects() {
    return [
      { source: '/influencer-club', destination: '/creator-club', permanent: true },
      { source: '/en/influencer-club', destination: '/en/creator-club', permanent: true },
      { source: '/influencer-events', destination: '/creator-events', permanent: true },
      { source: '/en/influencer-events', destination: '/en/creator-events', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "share-your-party",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
