import type { Metadata } from 'next'
import BrandOrderForm from '@/views/brand/BrandOrderForm'

export const metadata: Metadata = {
  title: 'Edit draft',
  description: 'Change your order draft.',
  robots: { index: false, follow: false },
}

export default function BrandOrderEditEnPage() {
  return <BrandOrderForm />
}
