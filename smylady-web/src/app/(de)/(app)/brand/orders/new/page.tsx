import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandOrderForm from '@/views/brand/BrandOrderForm'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast wird vom Gate
 * (BrandGate bzw. CreatorGate in components/) auf /login?next=… geleitet — /brand
 * steht bewusst nicht in publicPaths.
 */

export const metadata: Metadata = {
  title: 'Neuer Auftrag',
  description: 'Beschreibe dein Event und was du dir von Creatorn wünschst.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand/orders/new', 'de'),
}

export default function BrandOrderNewPage() {
  return <BrandOrderForm />
}
