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
    description: 'Entdecke Posts und Events in dieser Community.',
    alternates: localeAlternates(`/communities/${id}`, 'de'),
  }
}

export default async function CommunityPage({ params }: Props) {
  const { id } = await params
  return <CommunityDetailPage communityId={id} />
}
