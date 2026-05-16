import { Suspense } from 'react'
import HostEvents from '@/views/HostEvents'

export default function HostEventsPage() {
  return (
    <Suspense>
      <HostEvents />
    </Suspense>
  )
}
