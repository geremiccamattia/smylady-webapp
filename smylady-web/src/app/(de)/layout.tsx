import type { Metadata } from 'next'
import Providers from '../providers'
import { GtmScript, GtmNoScript, sharedMetadata } from '../root-shell'
import '@/index.css'

/**
 * Root-Layout des deutschen Zweigs.
 *
 * Zwei Root-Layouts statt einem, damit <html lang> die tatsächliche Sprache trägt:
 * Die Sprachen laufen über echte Verzeichnisse, nicht über Middleware, und ein
 * einzelnes Root-Layout hätte auf /en/… weiterhin lang="de" ausgeliefert.
 * Route-Groups erscheinen nicht im Pfad, alle URLs bleiben also unverändert.
 */

export const metadata: Metadata = {
  ...sharedMetadata,
  title: {
    default: 'Share Your Party',
    template: '%s | Share Your Party',
  },
  description:
    'Entdecke Events in deiner Nähe – Partys, Konzerte, Festivals und mehr. Finde dein nächstes Erlebnis auf Share Your Party.',
}

export default function GermanRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <GtmScript />
      </head>
      <body suppressHydrationWarning>
        <GtmNoScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
