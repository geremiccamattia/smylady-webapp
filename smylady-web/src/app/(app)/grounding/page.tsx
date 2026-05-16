import type { Metadata } from 'next'
import GroundingPage from '@/views/GroundingPage'

export const metadata: Metadata = {
  title: 'Grounding',
  robots: { index: false }, // interne Seite – aus Google raushalten
}

export default function GroundingRoute() {
  return <GroundingPage />
}
