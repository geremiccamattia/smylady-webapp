import { Suspense } from 'react'
import Settings from '@/views/Settings'

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  )
}
