import Script from 'next/script'
import { SITE_URL } from '@/lib/seo'

/**
 * Gemeinsame Bestandteile der beiden Root-Layouts (de) und (en).
 *
 * Seit der Trennung in zwei Root-Layouts — nötig, damit <html lang> die Sprache der
 * Seite trägt — gibt es zwei Stellen, an denen GTM und die Provider eingehängt
 * werden. Alles ausser <html> und <body> steht deshalb hier, damit die beiden
 * Layouts nicht auseinanderlaufen können.
 */

const GTM_ID = 'GTM-K5G6QX8F'

/** Gehört in den <head>. */
export function GtmScript() {
  return (
    <Script
      id="gtm"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  )
}

/** Gehört an den Anfang des <body>. */
export function GtmNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}

/**
 * Metadaten, die für beide Sprachen gelten.
 *
 * `openGraph.url` steht hier bewusst NICHT: Als Vorgabe im Root-Layout hat es dazu
 * geführt, dass jede Seite ohne eigenes openGraph-Objekt die nackte Domain als
 * og:url ausgewiesen hat. Fehlt og:url, verwenden Scraper die aufgerufene URL —
 * das ist richtig. Seiten, die es genauer wissen, setzen es selbst (canonicalUrl).
 */
export const sharedMetadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: 'Share Your Party',
    type: 'website' as const,
    images: [{ url: `${SITE_URL}/logo.png` }],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
}
