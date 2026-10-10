import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandDashboard from '@/views/brand/BrandDashboard'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast erhält 401, und der
 * Response-Interceptor in services/api.ts leitet ihn auf /login um — /brand
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
