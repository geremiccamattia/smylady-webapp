import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandTeam from '@/views/brand/BrandTeam'

export const metadata: Metadata = {
  title: 'Team',
  description: 'Members and invitations of your brand.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand/team', 'en'),
}

export default function BrandTeamEnPage() {
  return <BrandTeam />
}
