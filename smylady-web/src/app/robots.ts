import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  /*
   * Preview-Deployments sperren alles und nennen keine Sitemap. Sonst sagte die
   * robots.txt einer Preview dasselbe wie die der Produktion — einschließlich
   * der Sitemap-Verweise auf shareyourparty.de.
   *
   * Ergänzt den X-Robots-Tag aus next.config.ts, ersetzt ihn aber nicht: Ein
   * Crawler, der robots.txt befolgt, ruft die Seiten gar nicht erst ab und sieht
   * den Header damit nie. Der Header greift für alles, was trotzdem geholt wird.
   */
  if (process.env.VERCEL_ENV === 'preview') {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/profile', '/my-events', '/my-tickets', '/ticket/',
        '/chat', '/settings', '/notifications', '/favorites',
        '/create-event', '/edit-event/', '/scan/', '/drafts',
        '/subscribers', '/payment-complete', '/taxes',
        '/preview-event/', '/blocked-users', '/safety-companions',
        '/friends', '/stories', '/advertise/',
        '/en/profile', '/en/my-events', '/en/my-tickets', '/en/ticket/',
        '/en/chat', '/en/settings', '/en/notifications', '/en/favorites',
        '/en/create-event', '/en/edit-event/', '/en/scan/', '/en/drafts',
        '/en/subscribers', '/en/payment-complete', '/en/taxes',
        '/en/preview-event/', '/en/blocked-users', '/en/safety-companions',
        '/en/friends', '/en/stories', '/en/advertise/',
      ],
    },
    sitemap: [
      'https://shareyourparty.de/sitemap-de.xml',
      'https://shareyourparty.de/sitemap-en.xml',
    ],
  }
}
