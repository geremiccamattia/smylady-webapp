import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandProfileEdit from '@/views/brand/BrandProfileEdit'
/*
 * Brand-Bereich: nur für angemeldete Marken. Ein Gast erhält 401, und der
 * Response-Interceptor in services/api.ts leitet ihn auf /login um — /brand
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
