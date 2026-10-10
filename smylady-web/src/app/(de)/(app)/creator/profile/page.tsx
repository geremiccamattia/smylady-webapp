import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorProfileEdit from '@/views/creator/CreatorProfileEdit'
/*
 * Creator-Bereich: nur für angemeldete Creator. Ein Gast erhält 401, und der
 * Response-Interceptor in services/api.ts leitet ihn auf /login um — /creator
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
