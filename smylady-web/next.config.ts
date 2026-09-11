import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next'

/*
 * Content-Security-Policy — vorerst NUR berichtend (Content-Security-Policy-Report-Only).
 * Verstöße erscheinen in der Browserkonsole, blockiert wird nichts. Erst wenn die
 * Konsole auf allen wichtigen Seiten sauber ist, auf "Content-Security-Policy"
 * umstellen und dabei `upgrade-insecure-requests` ergänzen (im Report-Only-Modus
 * ignoriert der Browser diese Direktive).
 *
 * Bewusste Entscheidungen:
 * - 'unsafe-inline' bei Scripts: Ohne Nonces nicht zu vermeiden. Nonces erzwingen
 *   dynamisches Rendering für jede Seite — kein statisches Rendering, kein CDN-Cache.
 *   Das widerspräche dem Zweck der Next.js-Migration (Ladezeit, SEO). Folge: Gegen
 *   eingeschleuste Inline-Skripte schützt diese Richtlinie kaum; ihr Nutzen liegt vor
 *   allem bei frame-ancestors, object-src, base-uri und form-action.
 * - KEIN 'unsafe-eval': heic2any (HEIC-Anzeige in Stories/ImageViewer) nutzt
 *   `new Function` und wird Meldungen erzeugen. Seit Uploads serverseitig konvertiert
 *   werden, betrifft das nur den Altbestand. Greift der Pfad kaum noch, heic2any
 *   entfernen, statt die Richtlinie aufzuweichen.
 * - cdn.jsdelivr.net: browser-image-compression lädt im Web Worker sein Skript von
 *   dort. Ohne Worker fällt die Bibliothek auf den Haupt-Thread zurück und blockiert
 *   beim Komprimieren die Oberfläche — auf dem Handy spürbar.
 * - m1.openfpcdn.io fehlt absichtlich: Der Statistik-Ping von fingerprintjs ist in
 *   src/hooks/useFingerprint.ts abgeschaltet.
 * - Kein report-uri an Sentry: AdSense und Browser-Erweiterungen erzeugen so viele
 *   Meldungen, dass das Sentry-Kontingent in Tagen verbraucht wäre.
 * - Google Maps fehlt, weil es nur als Link vorkommt, nicht eingebettet.
 *
 * Die Vercel-Toolbar (vercel.live) gibt es nur auf Preview-Deployments, deshalb nur
 * dort. VERCEL_ENV ist beim Build auf Vercel gesetzt; headers() wird beim Build
 * ausgewertet.
 */
const isVercelPreview = process.env.VERCEL_ENV === 'preview'
const previewOnly = (...sources: string[]) => (isVercelPreview ? sources : [])

const S3_BUCKET = 'https://smylady-bucket.s3.eu-central-1.amazonaws.com'

const cspDirectives: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    // Google Tag Manager / GA4
    'https://*.googletagmanager.com',
    // Google Ads (Conversion-Tags im GTM-Container)
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
    // AdSense (wird erst nach Marketing-Consent geladen, siehe CookieConsent.tsx)
    'https://pagead2.googlesyndication.com',
    'https://tpc.googlesyndication.com',
    'https://adservice.google.com',
    'https://*.adtrafficquality.google',
    // Meta-Pixel (Custom-HTML-Tag im GTM-Container)
    'https://connect.facebook.net',
    // Stripe
    'https://js.stripe.com',
    'https://*.js.stripe.com',
    // Google-Login (GSI)
    'https://accounts.google.com',
    // browser-image-compression (Web Worker)
    'https://cdn.jsdelivr.net',
    ...previewOnly('https://vercel.live'),
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    // Google Fonts auf der Veranstalter-Seite
    'https://fonts.googleapis.com',
    'https://accounts.google.com',
    ...previewOnly('https://vercel.live'),
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
    ...previewOnly('https://vercel.live', 'https://assets.vercel.com'),
  ],
  // Pauschal https: — das Backend liefert Bilder nicht nur aus S3, sondern auch von
  // Ticketmaster, universe.com und beliebigen Veranstalter-Domains.
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'media-src': ["'self'", 'blob:', S3_BUCKET],
  'connect-src': [
    "'self'", // enthält den Sentry-Tunnel /monitoring
    // Backend und Chat-WebSocket (Live-Bundle nutzt onrender.com)
    'https://smylady-backend.onrender.com',
    'wss://smylady-backend.onrender.com',
    'https://app.shareyourparty.de',
    'wss://app.shareyourparty.de',
    // fetch() auf S3-Bilder: HEIC-Konvertierung, Bild- und QR-Download
    S3_BUCKET,
    'https://api.stripe.com',
    'https://accounts.google.com',
    'https://nominatim.openstreetmap.org',
    // GA4
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    // Google Ads / AdSense
    'https://www.google.com',
    'https://www.google.de',
    'https://www.google.at',
    'https://googleads.g.doubleclick.net',
    'https://pagead2.googlesyndication.com',
    'https://*.adtrafficquality.google',
    // Meta-Pixel
    'https://www.facebook.com',
    'https://connect.facebook.net',
    'https://capi-automation.s3.us-east-2.amazonaws.com',
    ...previewOnly('https://vercel.live', 'wss://ws-us3.pusher.com'),
  ],
  'frame-src': [
    'https://www.youtube.com',
    'https://open.spotify.com',
    'https://js.stripe.com',
    'https://*.js.stripe.com',
    'https://hooks.stripe.com',
    'https://accounts.google.com',
    'https://www.googletagmanager.com',
    'https://td.doubleclick.net',
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://www.google.com',
    'https://*.adtrafficquality.google',
    ...previewOnly('https://vercel.live'),
  ],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
}

const contentSecurityPolicy = Object.entries(cspDirectives)
  .map(([directive, sources]) => [directive, ...sources].join(' '))
  .join('; ')

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

      /*
       * Altbestand der statischen Vorgänger-Website. Diese Seiten lagen alle flach im
       * Wurzelverzeichnis, es gab kein /en/-Präfix — deshalb hier bewusst keine
       * /en/-Entsprechungen.
       *
       * Die zugehörigen Dateien liegen noch in public/ und werden mit jedem Deploy
       * ausgeliefert. Das ist unschädlich: In der Next.js-Routing-Reihenfolge greifen
       * redirects() VOR dem Dateisystem, die Weiterleitung gewinnt also gegen die
       * Datei. Nach dem Löschen der Dateien bleiben die Regeln trotzdem nötig — die
       * URLs stehen in Google und in alten Links.
       */
      { source: '/impressum.htm', destination: '/imprint', permanent: true },
      { source: '/datenschutz.htm', destination: '/privacy', permanent: true },
      { source: '/privacy-policy.htm', destination: '/privacy', permanent: true },
      { source: '/index.htm', destination: '/explore', permanent: true },
      // index.html ist byte-identisch mit index.htm und verweist auf ein längst
      // entferntes Vite-Bundle — dieselbe Behandlung.
      { source: '/index.html', destination: '/explore', permanent: true },
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
      /*
       * Sicherheits-Header für alle Routen (Befund aus dem Sicherheitsscan).
       *
       * X-Frame-Options SAMEORIGIN: Keine Seite dieser App wird von fremden Seiten
       * eingebettet. Die iframes, die es gibt (YouTube auf Home, Spotify, Stripe,
       * Google-Login), gehen in die umgekehrte Richtung — wir betten ein — und sind
       * von diesem Header nicht betroffen.
       *
       * Permissions-Policy: Nur Features sperren, die nirgends gebraucht werden.
       * - camera=(self): Ticket-Scanner unter /s/[token] und /scan/[eventId].
       * - geolocation=(self): Explore, Community-Events, Login, Standort im Chat.
       * - payment mit js.stripe.com: Apple Pay / Google Pay laufen im Stripe-iframe
       *   und brauchen die Delegation, sonst fallen die Wallet-Buttons weg.
       * - Nicht aufgeführt (Browser-Standard bleibt): fullscreen, autoplay,
       *   encrypted-media (YouTube-iframe), identity-credentials-get (Google-Login)
       *   und die Werbe-APIs wie browsing-topics (AdSense).
       *
       * Strict-Transport-Security fehlt hier bewusst: Vercel setzt ihn bereits für
       * alle Antworten der Domain.
       */
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(self), geolocation=(self), microphone=(), payment=(self "https://js.stripe.com"), usb=(), serial=(), hid=(), bluetooth=(), midi=(), display-capture=()',
          },
        ],
      },
      /*
       * CSP (Report-Only, siehe contentSecurityPolicy oben) — nicht für:
       * - /blog: WordPress hinter dem Rewrite, lädt eigene Assets.
       * - /_next/image: Next.js setzt dort bereits eine eigene CSP; beim späteren
       *   Durchsetzen würden sich zwei Richtlinien überlagern.
       * - /_next/static: JS/CSS-Dateien, keine Dokumente.
       */
      {
        source: '/((?!_next/static|_next/image|blog(?:/|$)).*)',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
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
