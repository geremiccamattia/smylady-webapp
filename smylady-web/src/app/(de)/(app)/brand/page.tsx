import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandDashboard from '@/views/brand/BrandDashboard'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /brand
 * steht bewusst nicht in publicPaths.
 */

export const metadata: Metadata = {
  title: 'Brand-Dashboard',
  description: 'Deine Aufträge an Creator auf einen Blick.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand', 'de'),
}

export default function BrandDashboardPage() {
  return <BrandDashboard />
}
