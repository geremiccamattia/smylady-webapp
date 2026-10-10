import type { Metadata } from 'next'
import BrandOrderDetail from '@/views/brand/BrandOrderDetail'

export const metadata: Metadata = {
  title: 'Order',
  description: 'Status, offer and proposed creators.',
  robots: { index: false, follow: false },
}

export default function BrandOrderEnPage() {
  return <BrandOrderDetail />
}
