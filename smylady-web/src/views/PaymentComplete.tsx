'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Ticket, Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'

function PaymentCompleteContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const ticketId = searchParams.get('ticketId')
  const type = searchParams.get('type') // 'door' | 'free' | null

  const heading = type === 'door'
    ? t('paymentComplete.headingDoor', { defaultValue: 'Du bist dabei!' })
    : type === 'free'
    ? t('paymentComplete.headingFree', { defaultValue: 'Reservierung abgeschlossen!' })
    : t('paymentComplete.heading', { defaultValue: 'Zahlung erfolgreich!' })

  const description = type === 'door'
    ? t('paymentComplete.descriptionDoor', { defaultValue: 'Wir erinnern dich rechtzeitig per Benachrichtigung an das Event.' })
    : type === 'free'
    ? t('paymentComplete.descriptionFree', { defaultValue: 'Dein Ticket wurde erfolgreich reserviert.' })
    : t('paymentComplete.description', { defaultValue: 'Dein Ticket wurde erfolgreich gekauft.' })

  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'ticket_purchased', ticket_id: ticketId })
  }, [])

  return (
    <div className="container max-w-md mx-auto py-12 px-4 text-center">
      <div className="mb-8">
        <CheckCircle className="h-24 w-24 mx-auto text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">{heading}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {ticketId && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => router.push(`/ticket/${ticketId}`)}
          >
            <Ticket className="h-4 w-4 mr-2" />
            {t('paymentComplete.previewBtn', { defaultValue: 'Ticket anzeigen' })}
          </Button>
        )}

        <Button className="w-full" onClick={() => router.push('/explore')}>
          <Compass className="h-4 w-4 mr-2" />
          {t('paymentComplete.exploreBtn', { defaultValue: 'Events erkunden' })}
        </Button>
      </div>
    </div>
  )
}

export default function PaymentComplete() {
  return (
    <Suspense>
      <PaymentCompleteContent />
    </Suspense>
  )
}
