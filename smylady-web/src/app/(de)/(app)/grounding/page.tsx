import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
// @ts-ignore
import GroundingPage from '@/views/GroundingPage'

/**
 * Faktenseite für Such- und KI-Systeme — soll ausdrücklich gefunden werden.
 * Das frühere robots.index = false hat genau das verhindert und stand ausserdem
 * im Widerspruch zum Sitemap-Eintrag dieser Seite.
 */
export const metadata: Metadata = {
  title: 'Grounding',
  description:
    'Was Share Your Party ist, was es nicht ist, offizielle Profile und häufige Fragen — die Faktenseite zur Plattform.',
  alternates: localeAlternates('/grounding', 'de'),
}

export default function GroundingRoute() {
  return <GroundingPage />
}
