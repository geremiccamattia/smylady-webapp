import type { Metadata } from 'next'
import CommunityDetailPage from '@/views/CommunityDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Community — Share Your Party',
    description: 'Discover posts and events in this community.',
    alternates: {
      canonical: `https://shareyourparty.de/en/communities/${id}`,
      languages: { de: `https://shareyourparty.de/communities/${id}` },
    },
  }
}

export default async function CommunityPageEN({ params }: Props) {
  const { id } = await params
  return <CommunityDetailPage communityId={id} />
}
