import type { Metadata } from 'next'
import CreatorAssignmentDetail from '@/views/creator/CreatorAssignmentDetail'
/*
 * Creator-Bereich: nur für angemeldete Creator. Ein Gast erhält 401, und der
 * Response-Interceptor in services/api.ts leitet ihn auf /login um — /creator
 * (ohne Bindestrich) steht bewusst nicht in publicPaths; /creator-club schon.
 */

export const metadata: Metadata = {
  title: 'Anfrage',
  description: 'Event, Vergütung und Briefing.',
  robots: { index: false, follow: false },
}

export default function CreatorAssignmentPage() {
  return <CreatorAssignmentDetail />
}
