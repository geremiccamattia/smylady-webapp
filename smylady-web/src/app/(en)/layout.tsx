import type { Metadata } from 'next'
import Providers from '../providers'
import { GtmScript, GtmNoScript, sharedMetadata } from '../root-shell'
import '@/index.css'

/**
 * Root-Layout des englischen Zweigs — siehe (de)/layout.tsx.
 * Einziger inhaltlicher Unterschied: lang="en" und die englischen Vorgabetexte.
 */

export const metadata: Metadata = {
  ...sharedMetadata,
  title: {
    default: 'Share Your Party',
    template: '%s | Share Your Party',
  },
  description:
    'Discover events near you – parties, concerts, festivals and more. Find your next experience on Share Your Party.',
}

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
