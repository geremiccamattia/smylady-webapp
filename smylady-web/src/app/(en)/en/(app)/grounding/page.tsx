import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import { groundingSchemas } from '@/lib/groundingSchemas'
// @ts-ignore
import GroundingPage from '@/views/GroundingPage'

/** Siehe (de)/(app)/grounding/page.tsx — dieselbe Seite, englische Schemas. */
export const metadata: Metadata = {
  title: 'Share Your Party – Event Platform for Austria & Germany',
  description:
    'Share Your Party is an event discovery and social media platform for Austria and Germany. Discover events, buy tickets, share parties.',
  alternates: localeAlternates('/grounding', 'en'),
}

export default function GroundingPagePageEN() {
  return (
    <>
      {groundingSchemas('en').map((schema) => (
        <script
          key={schema['@type'] + ('@id' in schema ? schema['@id'] : '')}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <GroundingPage />
    </>
  )
}
