import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
