import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CommunityDetailPage from '@/views/CommunityDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Community — Share Your Party',
    description: 'Discover posts and events in this community.',
    alternates: localeAlternates(`/communities/${id}`, 'en'),
  }
}

export default async function CommunityPageEN({ params }: Props) {
  const { id } = await params
  return <CommunityDetailPage communityId={id} />
}
