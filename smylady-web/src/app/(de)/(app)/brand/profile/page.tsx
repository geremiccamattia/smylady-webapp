import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandProfileEdit from '@/views/brand/BrandProfileEdit'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /brand
 * steht bewusst nicht in publicPaths.
 */

export const metadata: Metadata = {
  title: 'Brand-Profil bearbeiten',
  description: 'Angaben zu deinem Unternehmen ändern.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand/profile', 'de'),
}

export default function BrandProfilePage() {
  return <BrandProfileEdit />
}
