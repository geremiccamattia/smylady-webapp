import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Ticket, Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function PaymentComplete() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ticketId = searchParams.get('ticketId')

  return (
    <div className="container max-w-md mx-auto py-12 px-4 text-center">
      <div className="mb-8">
        <CheckCircle className="h-24 w-24 mx-auto text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">
          {t('paymentComplete.heading', { defaultValue: 'Zahlung erfolgreich!' })}
        </h1>
        <p className="text-muted-foreground">
          {t('paymentComplete.description', {
            defaultValue: 'Dein Ticket wurde erfolgreich gekauft.',
          })}
        </p>
      </div>

      <div className="space-y-3">
        {ticketId && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => navigate(`/ticket/${ticketId}`)}
          >
            <Ticket className="h-4 w-4 mr-2" />
            {t('paymentComplete.previewBtn', { defaultValue: 'Ticket anzeigen' })}
          </Button>
        )}

        <Button className="w-full" onClick={() => navigate('/explore')}>
          <Compass className="h-4 w-4 mr-2" />
          {t('paymentComplete.exploreBtn', { defaultValue: 'Events erkunden' })}
        </Button>
      </div>
    </div>
  )
}
