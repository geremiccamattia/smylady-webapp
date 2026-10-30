import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandTeam from '@/views/brand/BrandTeam'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /brand
 * steht bewusst nicht in publicPaths.
 */

export const metadata: Metadata = {
  title: 'Team',
  description: 'Mitglieder und Einladungen deiner Brand.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand/team', 'de'),
}

export default function BrandTeamPage() {
  return <BrandTeam />
}
