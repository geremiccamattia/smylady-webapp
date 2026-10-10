import type { Metadata } from 'next'
import BrandOrderDetail from '@/views/brand/BrandOrderDetail'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /brand
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
