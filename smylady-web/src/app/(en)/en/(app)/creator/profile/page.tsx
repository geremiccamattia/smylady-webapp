import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorProfileEdit from '@/views/creator/CreatorProfileEdit'

export const metadata: Metadata = {
  title: 'Edit creator profile',
  description: 'Update channels, categories and bio.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/creator/profile', 'en'),
}

export default function CreatorProfileEnPage() {
  return <CreatorProfileEdit />
}
