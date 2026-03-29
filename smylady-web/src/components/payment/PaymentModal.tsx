import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useConfirmPaymentIntent } from '@/hooks/useStripe'
import { formatPrice } from '@/lib/utils'
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  clientSecret: string
  paymentIntentId: string
  eventName: string
  amount: number
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentIntentId,
  eventName,
  amount,
}: PaymentModalProps) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { mutate: confirmPayment } = useConfirmPaymentIntent()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')
    setErrorMessage(null)

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      })

      if (error) {
        // Show error to customer
        setPaymentStatus('error')
        setErrorMessage(error.message || t('payment.genericError', { defaultValue: 'Zahlung fehlgeschlagen' }))
        setIsProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - confirm with backend to create ticket
        confirmPayment(paymentIntentId, {
          onSuccess: (ticket) => {
            setPaymentStatus('success')
            toast({
              title: t('payment.success', { defaultValue: 'Zahlung erfolgreich!' }),
              description: t('tickets.freeCreated'),
            })
            setTimeout(() => {
              onClose()
              navigate(`/payment-complete?ticketId=${ticket?._id || ticket?.id}`)
            }, 1500)
          },
          onError: () => {
            // Payment succeeded but ticket creation failed
            setPaymentStatus('success')
            toast({
              title: t('payment.success', { defaultValue: 'Zahlung erfolgreich!' }),
              description: t('tickets.creating'),
            })
            setTimeout(() => {
              onClose()
              navigate('/payment-complete')
            }, 1500)
          },
        })
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        toast({
          title: t('payment.processing', { defaultValue: 'Zahlung wird bearbeitet...' }),
          description: t('payment.pleaseWait', { defaultValue: 'Bitte warte einen Moment.' }),
        })
      }
    } catch (err) {
      console.error('Payment error:', err)
      setPaymentStatus('error')
      setErrorMessage(t('payment.failed'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentStatus('idle')
      setErrorMessage(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('payment.title', { defaultValue: 'Zahlung' })}
          </DialogTitle>
          <DialogDescription>
            {eventName} - {formatPrice(amount)}
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">
              {t('payment.successTitle', { defaultValue: 'Zahlung erfolgreich!' })}
            </h3>
            <p className="text-muted-foreground mt-2">
              {t('payment.redirecting', { defaultValue: 'Du wirst weitergeleitet...' })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  wallets: {
                    applePay: 'auto',
                    googlePay: 'auto',
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-muted-foreground">
                {t('payment.total', { defaultValue: 'Gesamt' })}
              </span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(amount)}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isProcessing}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                disabled={!stripe || !elements || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('payment.processing', { defaultValue: 'Verarbeite...' })}
                  </>
                ) : (
                  t('payment.pay', { defaultValue: 'Jetzt bezahlen' })
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {t('payment.secureNote', {
                defaultValue: 'Sichere Zahlung über Stripe. Deine Daten sind verschlüsselt.',
              })}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
