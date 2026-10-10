import type { Metadata } from 'next'
import BrandOrderDetail from '@/views/brand/BrandOrderDetail'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast erhält 401, und der
 * Response-Interceptor in services/api.ts leitet ihn auf /login um — /brand
 * steht bewusst nicht in publicPaths.
 */

export const metadata: Metadata = {
  title: 'Auftrag',
  description: 'Status, Angebot und vorgeschlagene Creator.',
  robots: { index: false, follow: false },
}

export default function BrandOrderPage() {
  return <BrandOrderDetail />
}
