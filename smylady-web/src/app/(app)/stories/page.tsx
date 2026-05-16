import { Suspense } from 'react'
import StoryViewer from '@/views/StoryViewer'

export default function StoryViewerPage() {
  return (
    <Suspense>
      <StoryViewer />
    </Suspense>
  )
}
