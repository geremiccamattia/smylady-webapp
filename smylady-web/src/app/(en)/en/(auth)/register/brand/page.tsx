import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandRegister from '@/views/auth/BrandRegister'

// See the German route for why this sits under /register and is noindex.
export const metadata: Metadata = {
  title: 'Register as a brand',
  description: 'Create a brand profile on Share Your Party and reach the community directly.',
  robots: { index: false, follow: true },
  alternates: localeAlternates('/register/brand', 'en'),
}

export default function BrandRegisterEnPage() {
  return <BrandRegister />
}
