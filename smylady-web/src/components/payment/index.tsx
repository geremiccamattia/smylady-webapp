import { useState, useCallback } from 'react'
import { StripeElementsWrapper } from '@/contexts/StripeContext'
import { PaymentModal } from './PaymentModal'

interface PaymentWrapperProps {
  isOpen: boolean
  onClose: () => void
  clientSecret: string | null
  paymentIntentId: string | null
  eventName: string
  amount: number
}

export function PaymentWrapper({
  isOpen,
  onClose,
  clientSecret,
  paymentIntentId,
  eventName,
  amount,
}: PaymentWrapperProps) {
  if (!clientSecret) {
    return null
  }

  // Extract paymentIntentId from clientSecret if not provided
  const resolvedPaymentIntentId = paymentIntentId || clientSecret.split('_secret_')[0] || ''

  return (
    <StripeElementsWrapper clientSecret={clientSecret}>
      <PaymentModal
        isOpen={isOpen}
        onClose={onClose}
        clientSecret={clientSecret}
        paymentIntentId={resolvedPaymentIntentId}
        eventName={eventName}
        amount={amount}
      />
    </StripeElementsWrapper>
  )
}

// Hook to manage payment state
export function usePaymentModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string | null
    paymentIntentId: string | null
    eventName: string
    amount: number
  }>({
    clientSecret: null,
    paymentIntentId: null,
    eventName: '',
    amount: 0,
  })

  const openPayment = useCallback(
    (data: {
      clientSecret: string
      paymentIntentId: string
      eventName: string
      amount: number
    }) => {
      setPaymentData(data)
      setIsOpen(true)
    },
    []
  )

  const closePayment = useCallback(() => {
    setIsOpen(false)
    // Reset data after modal closes
    setTimeout(() => {
      setPaymentData({
        clientSecret: null,
        paymentIntentId: null,
        eventName: '',
        amount: 0,
      })
    }, 300)
  }, [])

  return {
    isOpen,
    paymentData,
    openPayment,
    closePayment,
  }
}

export { PaymentModal } from './PaymentModal'
