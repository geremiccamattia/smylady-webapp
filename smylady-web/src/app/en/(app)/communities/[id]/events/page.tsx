import type { Metadata } from 'next'
import CommunityEventsPage from '@/views/CommunityEventsPage'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Community Events — Share Your Party',
}

export default async function CommunityEventsEN({ params }: Props) {
  const { id } = await params
  return <CommunityEventsPage communityId={id} />
}
