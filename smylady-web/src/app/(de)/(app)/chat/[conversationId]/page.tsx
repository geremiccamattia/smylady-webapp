import { Suspense } from 'react'
import Conversation from '@/views/Conversation'

export default function ConversationPage() {
  return (
    <Suspense>
      <Conversation />
    </Suspense>
  )
}
