import type { Metadata } from 'next'
import CreateCommunityPage from '@/views/CreateCommunityPage'

export const metadata: Metadata = {
  title: 'Community erstellen — Share Your Party',
  description: 'Erstelle eine Community auf Share Your Party.',
}

export default function CreateCommunity() {
  return <CreateCommunityPage />
}
