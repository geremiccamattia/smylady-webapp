import type { Metadata } from 'next'
import Script from 'next/script'
import Providers from './providers'
import '@/index.css'

export const metadata: Metadata = {
  title: {
    default: 'Share Your Party',
    template: '%s | Share Your Party',
  },
  description: 'Entdecke Events in deiner Nähe – Partys, Konzerte, Festivals und mehr. Finde dein nächstes Erlebnis auf Share Your Party.',
  openGraph: {
    siteName: 'Share Your Party',
    url: 'https://shareyourparty.de',
    type: 'website',
    images: [{ url: 'https://shareyourparty.de/logo.png' }],
  },
  metadataBase: new URL('https://shareyourparty.de'),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K5G6QX8F');`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K5G6QX8F"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
