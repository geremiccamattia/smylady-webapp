import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import { groundingSchemas } from '@/lib/groundingSchemas'
// @ts-ignore
import GroundingPage from '@/views/GroundingPage'

/**
 * Faktenseite für Such- und KI-Systeme — soll ausdrücklich gefunden werden.
 * Das frühere robots.index = false hat genau das verhindert.
 *
 * Titel und Beschreibung standen bis zuletzt zusätzlich im useEffect der
 * Client-Komponente und wurden dort per DOM-Manipulation überschrieben. Jetzt nur
 * noch hier, sonst konkurrieren zwei Mechanismen um dieselben Tags.
 */
export const metadata: Metadata = {
  title: 'Share Your Party – Event-Plattform für Österreich & Deutschland',
  description:
    'Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Events entdecken, Tickets kaufen, Partys teilen.',
  alternates: localeAlternates('/grounding', 'de'),
}

export default function GroundingRoute() {
  return (
    <>
      {groundingSchemas('de').map((schema) => (
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
