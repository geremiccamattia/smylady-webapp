import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorDashboard from '@/views/creator/CreatorDashboard'
/*
 * Creator-Bereich: nur für angemeldete Creator. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /creator
 * (ohne Bindestrich) steht bewusst nicht in publicPaths; /creator-club schon.
 */

export const metadata: Metadata = {
  title: 'Creator-Bereich',
  description: 'Deine Anfragen von Brands und dein Profil.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/creator', 'de'),
}

export default function CreatorDashboardPage() {
  return <CreatorDashboard />
}
