import type { Metadata } from 'next'
import BrandOrderForm from '@/views/brand/BrandOrderForm'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast erhält 401, und der
 * Response-Interceptor in services/api.ts leitet ihn auf /login um — /brand
 * steht bewusst nicht in publicPaths.
 */

export const metadata: Metadata = {
  title: 'Entwurf bearbeiten',
  description: 'Deinen Auftragsentwurf ändern.',
  robots: { index: false, follow: false },
}

export default function BrandOrderEditPage() {
  return <BrandOrderForm />
}
