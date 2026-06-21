'use client'

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
  eventId?: string | null
}

export function PaymentWrapper({
  isOpen,
  onClose,
  clientSecret,
  paymentIntentId,
  eventName,
  amount,
  eventId,
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
        eventId={eventId}
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
    eventId?: string | null
  }>({
    clientSecret: null,
    paymentIntentId: null,
    eventName: '',
    amount: 0,
    eventId: null,
  })

  const openPayment = useCallback(
    (data: {
      clientSecret: string
      paymentIntentId: string
      eventName: string
      amount: number
      eventId?: string | null
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
        eventId: null,
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
