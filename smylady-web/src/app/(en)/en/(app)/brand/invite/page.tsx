import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandInvite from '@/views/brand/BrandInvite'

// Siehe die deutsche Route: kein Login nötig, kein Index, kein Referrer.
export const metadata: Metadata = {
  title: 'Brand invitation',
  description: 'Accept the invitation to join a brand team.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  alternates: localeAlternates('/brand/invite', 'en'),
}

export default function BrandInviteEnPage() {
  return <BrandInvite />
}
