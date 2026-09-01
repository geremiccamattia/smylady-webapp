import { Suspense } from 'react'
import EventReviews from '@/views/EventReviews'

export default function EventReviewsPage() {
  return (
    <Suspense>
      <EventReviews />
    </Suspense>
  )
}
