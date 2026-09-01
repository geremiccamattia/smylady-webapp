import { Suspense } from 'react'
import PaymentComplete from '@/views/PaymentComplete'

export default function PaymentCompletePage() {
  return (
    <Suspense>
      <PaymentComplete />
    </Suspense>
  )
}
