import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorApply from '@/views/CreatorApply'

/*
 * Geschützte Seite: Der Abruf GET /influencer/my-application läuft gegen den
 * AuthenticatedGuard. Ein Gast erhält 401, und der Response-Interceptor in
 * services/api.ts leitet ihn auf /login um — das ist hier gewollt und der
 * Grund, warum diese Route NICHT in publicPaths steht.
 *
 * noindex und keine Sitemap: ein Formular hinter dem Login.
 */
export const metadata: Metadata = {
  title: 'Creator Club Bewerbung',
  description: 'Bewirb dich für den Share Your Party Creator Club.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/creator/apply', 'de'),
}

export default function CreatorApplyPage() {
  return <CreatorApply />
}
