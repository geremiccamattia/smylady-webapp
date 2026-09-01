import type { Metadata } from 'next'
import CreateCommunityPage from '@/views/CreateCommunityPage'

export const metadata: Metadata = {
  title: 'Create a Community — Share Your Party',
  description: 'Create a community on Share Your Party.',
}

export default function CreateCommunityEN() {
  return <CreateCommunityPage />
}
