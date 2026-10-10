import type { Metadata } from 'next'
import CreatorAssignmentDetail from '@/views/creator/CreatorAssignmentDetail'

export const metadata: Metadata = {
  title: 'Request',
  description: 'Event, compensation and briefing.',
  robots: { index: false, follow: false },
}

export default function CreatorAssignmentEnPage() {
  return <CreatorAssignmentDetail />
}
