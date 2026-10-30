import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandInvite from '@/views/brand/BrandInvite'
/*
 * Bewusst unter (app): Die Route-Gruppe erzwingt keinen Login, die Vorschau
 * läuft also auch für Gäste; /brand/invite steht dafür in publicPaths.
 *
 * Die Adresse trägt den Einladungs-Token: nicht indexieren, und über Links
 * auf dieser Seite nicht als Referrer weitergeben.
 */

export const metadata: Metadata = {
  title: 'Einladung in eine Brand',
  description: 'Nimm die Einladung ins Team einer Brand an.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  alternates: localeAlternates('/brand/invite', 'de'),
}

export default function BrandInvitePage() {
  return <BrandInvite />
}
