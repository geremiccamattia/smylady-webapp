import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandProfileEdit from '@/views/brand/BrandProfileEdit'

export const metadata: Metadata = {
  title: 'Edit brand profile',
  description: 'Update your company details.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand/profile', 'en'),
}

export default function BrandProfileEnPage() {
  return <BrandProfileEdit />
}
