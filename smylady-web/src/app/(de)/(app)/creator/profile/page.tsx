import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorProfileEdit from '@/views/creator/CreatorProfileEdit'
/*
 * Creator-Bereich: nur für angemeldete Creator. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /creator
 * (ohne Bindestrich) steht bewusst nicht in publicPaths; /creator-club schon.
 */

export const metadata: Metadata = {
  title: 'Creator-Profil bearbeiten',
  description: 'Kanäle, Kategorien und Bio ändern.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/creator/profile', 'de'),
}

export default function CreatorProfilePage() {
  return <CreatorProfileEdit />
}
