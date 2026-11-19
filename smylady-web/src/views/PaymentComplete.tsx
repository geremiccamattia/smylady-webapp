'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Ticket, Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { eventsService } from '@/services/events'
import { ticketsService } from '@/services/tickets'
import { useConfirmPaymentIntent } from '@/hooks/useStripe'
import { useToast } from '@/hooks/use-toast'

function PaymentCompleteContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlTicketId = searchParams.get('ticketId')
  const eventId = searchParams.get('eventId')
  const type = searchParams.get('type')

  /*
   * Rückkehr von Stripe über die return_url aus PaymentModal (nur wenn die
   * Zahlart weiterleitet, z. B. 3-D Secure): Stripe hängt payment_intent,
   * payment_intent_client_secret und redirect_status an — ohne ticketId.
   * Beim ersten Rendern festhalten; der Effekt unten nimmt die Parameter
   * gleich danach aus der Adresse.
   */
  const [stripeReturn] = useState(() => ({
    paymentIntent: searchParams.get('payment_intent'),
    redirectStatus: searchParams.get('redirect_status'),
  }))
  // Ticket aus confirm-payment, wenn die Adresse keine ticketId trägt.
  const [confirmedTicketId, setConfirmedTicketId] = useState<string | null>(null)
  const ticketId = urlTicketId || confirmedTicketId
  const { mutate: confirmPayment } = useConfirmPaymentIntent()

  const [values, setValues] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventById(eventId!),
    enabled: !!eventId,
  })

  const optionalQuestions = (event?.questions || []).filter(
    (q: any) => !q.required
  )

  const heading = type === 'door'
    ? t('paymentComplete.headingDoor', { defaultValue: 'Du bist dabei!' })
    : type === 'free'
    ? t('paymentComplete.headingFree', { defaultValue: 'Du bist dabei!' })
    : t('paymentComplete.heading', { defaultValue: 'Zahlung erfolgreich!' })

  const description = type === 'door'
    ? t('paymentComplete.descriptionDoor', { defaultValue: 'Wir erinnern dich rechtzeitig per Benachrichtigung an das Event.' })
    : type === 'free'
    ? t('paymentComplete.descriptionFree', { defaultValue: 'Dein Ticket ist bestätigt.' })
    : t('paymentComplete.description', { defaultValue: 'Dein Ticket wurde erfolgreich gekauft.' })

  /*
   * Die Stripe-Parameter sofort aus der Adresse nehmen: Das Client-Secret
   * gehört nicht in Verlauf, Weitergabe oder Tracking. Die Werte sind oben in
   * stripeReturn festgehalten. Dieser Effekt steht vor den übrigen und läuft
   * damit zuerst; ticketId, eventId und type bleiben.
   */
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const stripeParams = ['payment_intent', 'payment_intent_client_secret', 'redirect_status']
      if (!stripeParams.some((name) => url.searchParams.has(name))) return
      stripeParams.forEach((name) => url.searchParams.delete(name))
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {
      // Ohne History-API bleibt die Adresse, wie sie ist.
    }
  }, [])

  /*
   * Nach der Weiterleitung hat niemand das Ticket bestätigt (PaymentModal tut
   * das nur ohne Weiterleitung). Bei redirect_status 'succeeded' und ohne
   * ticketId deshalb hier confirm-payment mit dem Payment Intent — das
   * Backend prüft ihn bei Stripe, ist idempotent und liefert das Ticket.
   * Fehler: keine eigene Behandlung, die Seite bleibt wie bisher.
   */
  const confirmStarted = useRef(false)
  useEffect(() => {
    if (confirmStarted.current || urlTicketId) return
    if (stripeReturn.redirectStatus !== 'succeeded' || !stripeReturn.paymentIntent) return
    confirmStarted.current = true
    confirmPayment(stripeReturn.paymentIntent, {
      onSuccess: (ticket) => {
        const id = ticket?._id || ticket?.id
        if (id) setConfirmedTicketId(String(id))
      },
    })
    // Läuft genau einmal: Die Werte stammen aus dem ersten Rendern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Der Kauf wird genau einmal gemeldet — auch wenn der Betrag nachgeladen wird.
  const purchaseReported = useRef(false)
  const purchaseStarted = useRef(false)

  useEffect(() => {
    // Zahlart aus der URL (type): 'free' kostenlos, 'door' Abendkasse (vor Ort
    // bezahlt, hier also 0 €), 'balance' Guthaben, ohne type Stripe.
    const knownZero = type === 'free' || type === 'door'

    // Ohne Ticket-ID kein Ereignis (außer kostenlos/Abendkasse wie bisher).
    // Kommt die ID erst aus confirm-payment, läuft der Effekt dann erneut.
    if (purchaseStarted.current || (!knownZero && !ticketId)) return
    purchaseStarted.current = true

    const report = (value: number | null) => {
      if (purchaseReported.current) return
      purchaseReported.current = true
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'ticket_purchased',
        ticket_id: ticketId,
        is_free: type === 'free',
        // Zahlart aus type in der Adresse; ohne type war es eine Stripe-Zahlung.
        payment_type: type === 'free' || type === 'door' || type === 'balance' ? type : 'stripe',
        // Ohne sicheren Betrag kein value — lieber weglassen als erfinden.
        ...(value !== null ? { value, currency: 'EUR' } : {}),
      })
    }

    if (knownZero || !ticketId) {
      report(knownZero ? 0 : null)
      return
    }

    // Bezahlt: Betrag laut Backend (amountPaid, Euro; null, wenn nicht
    // zuzuordnen, etwa ganz mit Guthaben bezahlt). Antwortet es nicht
    // rechtzeitig oder gar nicht, geht der Kauf ohne Betrag raus.
    const fallback = setTimeout(() => report(null), 3000)
    ticketsService
      .getTicketById(ticketId)
      .then((ticket) => {
        const amount = ticket?.amountPaid
        report(typeof amount === 'number' && Number.isFinite(amount) ? amount : null)
      })
      .catch(() => report(null))
      .finally(() => clearTimeout(fallback))
    // Kein Cleanup, das den Timer löscht: Verlässt jemand die Seite vor der
    // Antwort, soll der Kauf trotzdem gemeldet werden.
    // ticketId als Abhängigkeit, damit eine ID aus confirm-payment noch
    // gemeldet wird; purchaseStarted/purchaseReported halten es bei genau
    // einem Ereignis pro Seitenaufruf.
  }, [ticketId, type])

  const setValue = (id: string, v: string | string[]) =>
    setValues((prev) => ({ ...prev, [id]: v }))

  const toggleMulti = (id: string, opt: string) => {
    const cur = Array.isArray(values[id]) ? (values[id] as string[]) : []
    setValue(id, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt])
  }

  const handleSubmitOptional = async () => {
    if (!ticketId) return
    setSubmitting(true)
    try {
      const answers = optionalQuestions
        .filter((q: any) => {
          const v = values[q.questionId]
          if (Array.isArray(v)) return v.length > 0
          return v && String(v).trim() !== ''
        })
        .map((q: any) => ({
          questionId: q.questionId,
          label: q.label,
          type: q.type,
          value: values[q.questionId] ?? '',
        }))

      if (answers.length > 0) {
        await ticketsService.submitTicketAnswers(ticketId, answers)
      }
      setSubmitted(true)
      toast({
        title: t('paymentComplete.answersSubmitted', {
          defaultValue: 'Danke für deine Antworten!',
        }),
      })
    } catch (error) {
      console.error('Error submitting answers:', error)
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: t('paymentComplete.answersError', {
          defaultValue: 'Antworten konnten nicht gespeichert werden.',
        }),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4 text-center">
      <div className="mb-8">
        <CheckCircle className="h-24 w-24 mx-auto text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">{heading}</h1>
        <p className="text-muted-foreground">{description}</p>
        {stripeReturn.redirectStatus === 'processing' && (
          <p className="text-muted-foreground mt-2">
            {t('paymentComplete.processing', { defaultValue: 'Zahlung wird bearbeitet.' })}
          </p>
        )}
      </div>

      {/* Optional Questions */}
      {optionalQuestions.length > 0 && !submitted && (
        <div className="mb-8 text-left bg-card border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">
            {t('paymentComplete.optionalTitle', {
              defaultValue: 'Noch ein paar kurze Fragen',
            })}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('paymentComplete.optionalHint', {
              defaultValue: 'Komplett optional — hilft dem Veranstalter bei der Planung.',
            })}
          </p>

          <div className="space-y-4">
            {optionalQuestions.map((q: any) => (
              <div key={q.questionId} className="space-y-1.5">
                <Label className="text-sm">{q.label}</Label>

                {q.type === 'text' && (
                  <Input
                    value={(values[q.questionId] as string) || ''}
                    onChange={(e) => setValue(q.questionId, e.target.value)}
                  />
                )}

                {q.type === 'select' && (
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={(values[q.questionId] as string) || ''}
                    onChange={(e) => setValue(q.questionId, e.target.value)}
                  >
                    <option value="">
                      {t('purchaseQuestions.choose', { defaultValue: 'Bitte wählen' })}
                    </option>
                    {(q.options || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.type === 'multiselect' && (
                  <div className="space-y-1">
                    {(q.options || []).map((opt: string) => {
                      const cur = Array.isArray(values[q.questionId])
                        ? (values[q.questionId] as string[])
                        : []
                      return (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cur.includes(opt)}
                            onChange={() => toggleMulti(q.questionId, opt)}
                          />
                          {opt}
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values[q.questionId] === 'true'}
                      onChange={(e) =>
                        setValue(q.questionId, e.target.checked ? 'true' : 'false')
                      }
                    />
                    {t('purchaseQuestions.yes', { defaultValue: 'Ja' })}
                  </label>
                )}
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-4"
            onClick={handleSubmitOptional}
            disabled={submitting}
          >
            {t('paymentComplete.submitAnswers', { defaultValue: 'Antworten absenden' })}
          </Button>
        </div>
      )}

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
