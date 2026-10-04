import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorApply from '@/views/CreatorApply'

// See the German route for why this page is protected, noindex and absent from the sitemap.
export const metadata: Metadata = {
  title: 'Creator Club application',
  description: 'Apply to the Share Your Party Creator Club.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/creator/apply', 'en'),
}

export default function CreatorApplyEnPage() {
  return <CreatorApply />
}
