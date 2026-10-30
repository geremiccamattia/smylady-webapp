'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  Clapperboard,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Lock,
  Pencil,
  Receipt,
  RefreshCw,
  Send,
  Target,
  Users,
  X,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import {
  brandService,
  isRateLimited,
  readBrandError,
  readMissingFields,
  type BrandOrder,
  type ProposedCreatorCard,
} from '@/services/brand'
import { eventsService } from '@/services/events'
import { formatDate, formatDateTime, formatDateTimeSmart, formatPrice, getInitials, resolveImageUrl } from '@/lib/utils'
import { formatRemaining, useCountdown, type RemainingUnits } from '@/lib/deadline'
import { navigateToExternalUrl, STRIPE_HOSTS } from '@/lib/navigation'
import { BrandGate, LoadingBars, OrderStatusBadge, OwnerOnlyHint, PaymentStatusBadge, useBrandLabels } from '@/components/brand/brandShared'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { ResponseBadge, useCreatorLabels } from '@/components/creator/creatorShared'
import { BRAND_ORDERS_QUERY_KEY } from './BrandDashboard'

/** Ab diesen Status steht die Besetzung und darf der Brand gezeigt werden. */
const PROPOSED_VISIBLE_FROM: BrandOrder['status'][] = ['offer_sent', 'awaiting_payment', 'confirmed', 'completed']

/** Bis hierhin beendet die Brand den Auftrag selbst; ab 'confirmed' nur noch über uns (409). */
const CANCELLABLE: BrandOrder['status'][] = [
  'draft',
  'submitted',
  'in_review',
  'creators_requested',
  'offer_sent',
  'awaiting_payment',
]

/** Wie oft die Seite nach der Rückkehr aus dem Checkout nachfragt, bis sie aufgibt. */
const MAX_PAYMENT_POLLS = 20

/** Abstand zwischen zwei Nachfragen bei Stripe (POST /:id/checkout/sync). */
const PAYMENT_POLL_MS = 3000

/**
 * Ein Auftrag aus Sicht der Brand.
 *
 * Je nach Status gibt es eine Aktion:
 *   draft              — bearbeiten, einreichen oder verwerfen
 *   submitted / in_review / creators_requested — warten, wir prüfen und
 *                        fragen Creator an; oder zurückziehen
 *   offer_sent         — Angebot mit Preis und zugesagten Creatorn ansehen,
 *                        annehmen UND bezahlen (Stripe) oder ablehnen
 *   awaiting_payment   — Zahlung läuft oder ist offen: fortsetzen oder abbrechen
 *   confirmed          — bezahlt, Event und Buchung stehen; Event öffentlich
 *                        machen oder nur für die Creator
 *   completed / cancelled — nur Ansicht
 *
 * Verwerfen, Zurückziehen, Ablehnen und Abbrechen sind dieselbe Stornierung
 * (POST /:id/cancel) mit freiwilligem Grund — endgültig, deshalb mit Rückfrage.
 *
 * Ein Mitglied liest mit und bearbeitet Entwürfe. Einreichen, Bezahlen,
 * Stornieren und die Sichtbarkeit bleiben dem Inhaber; das Backend weist sie
 * mit 403 ab, die Meldung zeigt fail().
 */
export default function BrandOrderDetail() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BrandGate>
        {/* useSearchParams braucht eine Suspense-Grenze (Rückkehr aus dem Checkout). */}
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <LoadingBars />
              </CardContent>
            </Card>
          }
        >
          <OrderDetail />
        </Suspense>
      </BrandGate>
    </div>
  )
}

function OrderDetail() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const labels = useBrandLabels()
  const { isOwner } = useBrandProfile()
  // Die Creator-Karten zeigen Enum-Werte des Creator-Profils (Plattform,
  // Follower-Bereich, Kategorie); die Beschriftung kommt aus dem Creator-Bereich.
  const creatorLabels = useCreatorLabels()
  const { id } = useParams<{ id: string }>()
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  // Nach dem Klick auf „bezahlen" bleibt der Knopf im Ladezustand, bis die
  // Seite zu Stripe wechselt — sonst klickt jemand zweimal.
  const [redirecting, setRedirecting] = useState(false)
  // Zurück aus dem Checkout: 'success' lässt die Seite nachfragen, bis die
  // Zahlung angekommen ist.
  const [returnState, setReturnState] = useState<'success' | 'cancelled' | null>(null)
  // Nach MAX_PAYMENT_POLLS Nachfragen gibt die Seite auf und bietet die
  // Prüfung von Hand an. Als State, weil die Anzeige davon abhängt.
  const [pollsExhausted, setPollsExhausted] = useState(false)
  const pollCount = useRef(0)
  const handledReturn = useRef(false)

  const orderQuery = useQuery<BrandOrder>({
    queryKey: ['brand', 'order', id],
    queryFn: () => brandService.getMyOrder(id),
    enabled: Boolean(id),
    retry: false,
  })
  const order = orderQuery.data

  // Die Sichtbarkeit hängt am Event, nicht am Auftrag. Nur ein 404 wird zu
  // null; jeder andere Fehler landet in isError, damit die Karte einen
  // Fehlerzustand zeigt statt „Nur Creator" als aktiv vorzutäuschen.
  const eventQuery = useQuery({
    queryKey: ['brand', 'order-event', order?.eventId],
    queryFn: () => eventsService.getEventByIdOrNull(order?.eventId as string, false),
    enabled: Boolean(order?.eventId),
    retry: false,
  })

  const applyUpdate = useCallback(
    (updated: BrandOrder) => {
      queryClient.setQueryData(['brand', 'order', id], updated)
      queryClient.invalidateQueries({ queryKey: BRAND_ORDERS_QUERY_KEY })
    },
    [queryClient, id],
  )

  const fail = (error: unknown, fallback: string) =>
    toast({
      variant: 'destructive',
      title: t('common.error', { defaultValue: 'Fehler' }),
      // 429: Der Rohtext des Backends („ThrottlerException") sagt der Brand nichts.
      description: isRateLimited(error)
        ? t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' })
        : readBrandError(error, fallback),
    })

  // Die Angebotsfrist läuft live mit: Verstreicht sie, während die Seite
  // offen ist, verschwindet der Bezahlknopf, statt in einen 409 zu laufen.
  const offerRemaining = useCountdown(order?.offerExpiresAt)
  const offerExpired = offerRemaining?.expired ?? false

  // Nachfragen bei Stripe statt nur den Auftrag zu lesen: POST /checkout/sync
  // zieht den Zahlungsstand nach, falls der Webhook hinterherhinkt, und holt
  // nach der Zahlung das Anlegen von Event und Buchung nach (provisioning).
  const paymentPolling =
    returnState === 'success' &&
    order?.status === 'awaiting_payment' &&
    order.payment?.status === 'pending' &&
    !pollsExhausted
  const provisioningPolling =
    order?.status === 'confirmed' && order.provisioning !== null && order.provisioning !== 'done' && !pollsExhausted
  // checkout/sync ist Sache des Inhabers; ein Mitglied bekäme nur 403.
  const syncPolling = Boolean(id) && isOwner && (paymentPolling || provisioningPolling)

  useEffect(() => {
    if (!syncPolling) return
    let active = true
    let inFlight = false
    const timer = setInterval(() => {
      if (inFlight) return
      if (pollCount.current >= MAX_PAYMENT_POLLS) {
        setPollsExhausted(true)
        return
      }
      pollCount.current += 1
      inFlight = true
      brandService
        .syncCheckout(id)
        .then((updated) => {
          if (active) applyUpdate(updated)
        })
        .catch(() => {
          // Ein einzelner Fehlschlag ist kein Grund aufzugeben; der nächste Tick fragt wieder.
        })
        .finally(() => {
          inFlight = false
        })
    }, PAYMENT_POLL_MS)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [syncPolling, id, applyUpdate])

  // Zurück per Browser-Zurück aus dem Checkout: Safari und Firefox stellen
  // die Seite aus dem bfcache wieder her — samt „weiterleiten…"-Zustand am
  // Knopf. Dann den Knopf freigeben und den Stand frisch laden.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      setRedirecting(false)
      orderQuery.refetch()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
    // orderQuery wechselt bei jedem Render die Referenz; refetch() ist stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Von Hand nachfragen, nachdem das automatische Nachfragen aufgegeben hat.
  const checkPayment = useMutation({
    mutationFn: () => brandService.syncCheckout(id),
    onSuccess: (updated) => {
      applyUpdate(updated)
      // Ein neuer Anlauf fürs automatische Nachfragen, falls es weiter offen ist.
      pollCount.current = 0
      setPollsExhausted(false)
    },
    onError: (error: unknown) =>
      fail(error, t('brandDashboard.checkPaymentFailed', { defaultValue: 'Der Zahlungsstand lässt sich gerade nicht prüfen.' })),
  })

  // Rückkehr von Stripe: ?payment=success&session_id=… bzw. ?payment=cancelled.
  // Einmal den Stand nachziehen, dann die Parameter aus der Adresse nehmen,
  // damit ein Reload nicht noch einmal „Zahlung abgebrochen" meldet.
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (!payment || handledReturn.current || !id) return
    handledReturn.current = true

    if (payment === 'success') {
      setReturnState('success')
      pollCount.current = 0
      setPollsExhausted(false)
      brandService
        .syncCheckout(id)
        .then(applyUpdate)
        .catch(() => queryClient.invalidateQueries({ queryKey: ['brand', 'order', id] }))
    } else if (payment === 'cancelled') {
      setReturnState('cancelled')
      toast({
        title: t('brandDashboard.paymentCancelledTitle', { defaultValue: 'Zahlung abgebrochen' }),
        description: t('brandDashboard.paymentCancelledDesc', {
          defaultValue: 'Du kannst die Zahlung jederzeit fortsetzen, solange das Angebot gültig ist.',
        }),
      })
      queryClient.invalidateQueries({ queryKey: ['brand', 'order', id] })
    }
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, id])

  const submit = useMutation({
    mutationFn: () => brandService.submitOrder(id),
    onSuccess: (updated) => {
      applyUpdate(updated)
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandDashboard.orderSubmitted', { defaultValue: 'Dein Auftrag ist eingereicht. Wir melden uns mit einem Angebot.' }),
      })
    },
    onError: (error: unknown) => {
      // Ein Entwurf darf unvollständig gespeichert sein; beim Einreichen
      // nennt das Backend die fehlenden Felder (400 mit data.missing). Die
      // beim Namen zu nennen hilft mehr als die generische Meldung.
      const missing = readMissingFields(error)
      if (missing.length > 0) {
        toast({
          variant: 'destructive',
          title: t('brandDashboard.submitIncompleteTitle', { defaultValue: 'Noch nicht vollständig' }),
          description: t('brandDashboard.submitIncompleteDesc', {
            fields: missing.map(labels.missingField).join(', '),
            defaultValue: 'Zum Einreichen fehlt noch: {{fields}}',
          }),
        })
        return
      }
      fail(error, t('brandDashboard.submitFailed', { defaultValue: 'Der Auftrag konnte nicht eingereicht werden.' }))
    },
  })

  // Annehmen und bezahlen in einem Schritt: Das Backend legt die
  // Stripe-Session an, die Brand wechselt zur Bezahlseite. Zurück geht es
  // auf diese Seite (returnPath, sprachabhängig).
  const checkout = useMutation({
    mutationFn: () =>
      brandService.startCheckout(id, localePath(`/brand/orders/${id}`), i18n.language === 'en' ? 'en' : 'de'),
    onSuccess: ({ url }) => {
      setRedirecting(true)
      if (!navigateToExternalUrl(url, STRIPE_HOSTS)) {
        setRedirecting(false)
        toast({
          variant: 'destructive',
          title: t('common.error', { defaultValue: 'Fehler' }),
          description: t('brandDashboard.checkoutFailed', { defaultValue: 'Die Bezahlseite konnte nicht geöffnet werden.' }),
        })
      }
    },
    onError: (error: unknown) => {
      // 409: Der Stand hat sich geändert (bezahlt, abgelaufen, storniert).
      queryClient.invalidateQueries({ queryKey: ['brand', 'order', id] })
      fail(error, t('brandDashboard.checkoutFailed', { defaultValue: 'Die Bezahlseite konnte nicht geöffnet werden.' }))
    },
  })

  const visibility = useMutation({
    mutationFn: (value: 'public' | 'selected') => brandService.setEventVisibility(id, value),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['brand', 'order-event', order?.eventId] })
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description:
          result.visibility === 'public'
            ? result.approvalPending
              ? t('brandDashboard.visibilityPublicPending', {
                  defaultValue: 'Das Event wird öffentlich, sobald wir es freigegeben haben.',
                })
              : t('brandDashboard.visibilityPublic', { defaultValue: 'Das Event ist jetzt öffentlich sichtbar.' })
            : t('brandDashboard.visibilitySelected', { defaultValue: 'Das Event ist nur für die eingeladenen Creator sichtbar.' }),
      })
    },
    onError: (error: unknown) => fail(error, t('brandDashboard.visibilityFailed', { defaultValue: 'Die Sichtbarkeit konnte nicht geändert werden.' })),
  })

  const cancel = useMutation({
    // Grund und Ausgangsstatus kommen als Variablen mit: Der Dialog leert den
    // Grund beim Schliessen, und nach dem Erfolg ist der Auftrag schon
    // storniert — aus dem Zustand liesse sich beides dann nicht mehr lesen.
    mutationFn: ({ reason }: { reason: string; fromOffer: boolean }) => brandService.cancelOrder(id, reason),
    onSuccess: (updated, { fromOffer }) => {
      applyUpdate(updated)
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: fromOffer
          ? t('brandDashboard.offerDeclined', { defaultValue: 'Angebot abgelehnt. Wir melden uns bei dir.' })
          : t('brandDashboard.orderCancelled', { defaultValue: 'Auftrag storniert.' }),
      })
    },
    onError: (error: unknown) => fail(error, t('brandDashboard.cancelFailed', { defaultValue: 'Der Auftrag konnte nicht storniert werden.' })),
  })

  if (orderQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingBars />
        </CardContent>
      </Card>
    )
  }

  if (orderQuery.isError || !order) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('brandDashboard.orderLoadFailed', { defaultValue: 'Der Auftrag lässt sich nicht laden.' })}
          </p>
          <Link href={localePath('/brand')}>
            <Button variant="outline">{t('brandDashboard.backToDashboard', { defaultValue: 'Zurück zum Dashboard' })}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const event = eventQuery.data
  // null, solange der Stand nicht bekannt ist (lädt oder Fehler): Dann ist
  // keiner der beiden Schalter aktiv, statt per Rückfall „Nur Creator".
  const eventUnknown = eventQuery.isLoading || eventQuery.isError
  const currentVisibility: 'public' | 'selected' | null = eventUnknown
    ? null
    : event?.visibility === 'public'
      ? 'public'
      : 'selected'
  const eventApproved = event?.status === 'Approved'
  const busy = submit.isPending || checkout.isPending || redirecting || visibility.isPending || cancel.isPending

  const payment = order.payment
  const paymentProcessing = order.status === 'awaiting_payment' && payment?.status === 'processing'
  // Bezahlen geht aus dem Angebot und aus einem offenen oder gescheiterten
  // Checkout — nicht, solange Geld unterwegs ist, nicht nach der Frist, und
  // nicht, während die Seite nach der Rückkehr aus dem Checkout noch auf die
  // Bestätigung wartet (sonst startet jemand eine zweite Zahlung).
  const payable =
    !offerExpired &&
    !paymentPolling &&
    order.offerPrice !== null &&
    (order.status === 'offer_sent' ||
      (order.status === 'awaiting_payment' && payment?.status !== 'processing'))
  const canPay = payable && isOwner
  // Welcher Text auf dem Bezahlknopf steht, hängt am Zahlungsstand: Ein
  // gescheiterter Versuch heisst „erneut", ein offener Checkout „fortsetzen".
  const payLabel =
    payment?.status === 'failed'
      ? t('brandDashboard.retryPayment', { defaultValue: 'Zahlung erneut versuchen' })
      : order.status === 'awaiting_payment' && payment?.status === 'pending'
        ? t('brandDashboard.continuePayment', { defaultValue: 'Zahlung fortsetzen' })
        : t('brandDashboard.acceptAndPay', { defaultValue: 'Angebot annehmen und bezahlen' })

  // Stornieren heisst je nach Status etwas anderes; Wortwahl und Icon folgen
  // dem. Solange Geld unterwegs ist oder die Bestätigung erwartet wird, geht
  // es nur über uns.
  const offerLike = order.status === 'offer_sent' || order.status === 'awaiting_payment'
  const checkoutLike = order.status === 'awaiting_payment'
  const canCancel = isOwner && CANCELLABLE.includes(order.status) && !paymentProcessing && !paymentPolling
  const cancelLabel =
    order.status === 'draft'
      ? t('brandDashboard.cancelDraft', { defaultValue: 'Entwurf verwerfen' })
      : checkoutLike
        ? t('brandDashboard.cancelCheckout', { defaultValue: 'Checkout abbrechen' })
        : offerLike
          ? t('brandDashboard.declineOffer', { defaultValue: 'Angebot ablehnen' })
          : t('brandDashboard.withdrawOrder', { defaultValue: 'Auftrag zurückziehen' })
  const cancelTitle =
    order.status === 'draft'
      ? t('brandDashboard.cancelDraftConfirmTitle', { defaultValue: 'Entwurf verwerfen?' })
      : checkoutLike
        ? t('brandDashboard.cancelCheckoutConfirmTitle', { defaultValue: 'Checkout abbrechen?' })
        : offerLike
          ? t('brandDashboard.declineOfferConfirmTitle', { defaultValue: 'Angebot ablehnen?' })
          : t('brandDashboard.withdrawConfirmTitle', { defaultValue: 'Auftrag zurückziehen?' })
  const cancelDescription =
    order.status === 'draft'
      ? t('brandDashboard.cancelDraftConfirmDesc', {
          defaultValue:
            'Der Entwurf wird storniert und lässt sich danach weder bearbeiten noch einreichen. Das lässt sich nicht rückgängig machen.',
        })
      : checkoutLike
        ? t('brandDashboard.cancelCheckoutConfirmDesc', {
            defaultValue:
              'Die Zahlung wird abgebrochen und der Auftrag storniert, die zugesagten Creator werden wieder freigegeben. Das lässt sich nicht rückgängig machen – für ein neues Angebot leg bitte einen neuen Auftrag an.',
          })
        : offerLike
          ? t('brandDashboard.declineOfferConfirmDesc', {
              defaultValue:
                'Der Auftrag wird storniert, die zugesagten Creator werden wieder freigegeben. Das lässt sich nicht rückgängig machen – für ein neues Angebot leg bitte einen neuen Auftrag an.',
            })
          : t('brandDashboard.withdrawConfirmDesc', {
              defaultValue:
                'Wir stoppen die Bearbeitung und der Auftrag wird storniert. Das lässt sich nicht rückgängig machen – ein neuer Auftrag ist jederzeit möglich.',
            })
  // Derselbe Knopf im Kopf der Seite und, beim Angebot, noch einmal in der Angebotskarte.
  const cancelButton = canCancel ? (
    <Button variant="outline" className="gap-2" disabled={busy} loading={cancel.isPending} onClick={() => setConfirmCancel(true)}>
      {offerLike ? <X className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      {cancelLabel}
    </Button>
  ) : null
  const responsesTotal = order.responses
    ? order.responses.accepted + order.responses.declined + order.responses.pending
    : 0

  return (
    <>
      <div>
        <Link href={localePath('/brand')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" />
          {t('brandDashboard.backToDashboard', { defaultValue: 'Zurück zum Dashboard' })}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{order.title}</h1>
            <OrderStatusBadge status={order.status} />
            {/* Der Zahlungsstand neben dem Status, wo er etwas sagt: im
                Checkout, nach einer Erstattung — und am Angebot, wenn ein
                Versuch gescheitert oder die Bezahlseite abgelaufen ist (das
                Backend setzt den Auftrag dann auf offer_sent zurück). */}
            {payment &&
              (order.status === 'awaiting_payment' ||
                payment.status === 'refunded' ||
                (order.status === 'offer_sent' && (payment.status === 'failed' || payment.status === 'expired'))) && (
                <PaymentStatusBadge status={payment.status} />
              )}
          </div>
          {order.status === 'draft' ? (
            <div className="flex gap-2 flex-wrap">
              {/* `disabled` am Button allein hält den Link nicht auf: Der
                  Klick landet trotzdem im Anker. Deshalb sperrt der Link
                  selbst, solange eine Aktion läuft. */}
              <Link
                href={localePath(`/brand/orders/${order.id}/edit`)}
                aria-disabled={busy}
                tabIndex={busy ? -1 : undefined}
                className={busy ? 'pointer-events-none' : undefined}
              >
                <Button variant="outline" className="gap-2" disabled={busy} tabIndex={-1}>
                  <Pencil className="h-4 w-4" />
                  {t('common.edit', { defaultValue: 'Bearbeiten' })}
                </Button>
              </Link>
              {isOwner && (
                <Button variant="gradient" className="gap-2" loading={submit.isPending} onClick={() => setConfirmSubmit(true)}>
                  <Send className="h-4 w-4" />
                  {t('brandDashboard.submitOrder', { defaultValue: 'Einreichen' })}
                </Button>
              )}
              {cancelButton}
            </div>
          ) : (
            // Eingereicht, in Prüfung, Angebot, Checkout: Zurückziehen bzw.
            // Ablehnen ist die einzige Aktion im Kopf. Ab 'confirmed' null.
            cancelButton
          )}
        </div>
      </div>

      {/* Statushinweis */}
      <StatusHint
        order={order}
        returnState={returnState}
        pollsExhausted={pollsExhausted}
        checking={checkPayment.isPending}
        onCheckPayment={() => checkPayment.mutate()}
        isOwner={isOwner}
      />

      {/* Ein Satz für das Mitglied dort, wo der Inhaber einen Knopf hätte. Beim
          Entwurf sagt das schon der Statushinweis. */}
      {!isOwner && order.status !== 'draft' && (payable || (CANCELLABLE.includes(order.status) && !paymentProcessing)) && (
        <OwnerOnlyHint />
      )}

      {/* Angebot und Zahlung */}
      {order.offerPrice !== null && (
        <Card className={canPay ? 'border-purple-200 bg-purple-50/40' : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('brandDashboard.offerTitle', { defaultValue: 'Unser Angebot' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold">{formatPrice(order.offerPrice)}</span>
              {order.offerSentAt && (
                <span className="text-sm text-muted-foreground">
                  {t('brandDashboard.offerSentAt', { defaultValue: 'vom' })} {formatDate(order.offerSentAt)}
                </span>
              )}
            </div>
            {order.offerNotes && <p className="text-sm whitespace-pre-wrap">{order.offerNotes}</p>}

            {/* Frist, solange das Angebot offen ist. */}
            {canPay && order.offerExpiresAt && <OfferDeadline expiresAt={order.offerExpiresAt} />}

            {canPay && (
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="gradient" className="gap-2" loading={checkout.isPending || redirecting} disabled={busy} onClick={() => checkout.mutate()}>
                    <CreditCard className="h-4 w-4" />
                    {payLabel}
                  </Button>
                  {cancelButton}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('brandDashboard.checkoutHint', {
                    defaultValue:
                      'Du wirst zu Stripe weitergeleitet: Karte, SEPA-Lastschrift oder Überweisung. Die Rechnung bekommst du per E-Mail. Mit dem Zahlungseingang sind die Creator verbindlich gebucht und dein Event ist angelegt.',
                  })}
                </p>
                {payment?.status === 'failed' && (
                  <p className="text-xs text-destructive mt-2">
                    {t('brandDashboard.paymentFailedHint', {
                      defaultValue: 'Die letzte Zahlung ist fehlgeschlagen. Bitte versuche es noch einmal, gern mit einer anderen Zahlungsart.',
                    })}
                    {payment.failureReason ? ` (${payment.failureReason})` : ''}
                  </p>
                )}
              </div>
            )}

            {paymentProcessing && (
              <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50/60 p-3 text-sm">
                <Clock className="h-5 w-5 shrink-0 text-blue-700 mt-0.5" />
                <p>
                  {t('brandDashboard.paymentProcessingHint', {
                    defaultValue:
                      'Die Zahlung wird verarbeitet. Bei Überweisung oder Lastschrift dauert das ein paar Tage; wir bestätigen, sobald das Geld eingegangen ist.',
                  })}
                </p>
              </div>
            )}

            {offerExpired && (order.status === 'offer_sent' || order.status === 'awaiting_payment') && (
              <p className="text-sm text-muted-foreground">
                {t('brandDashboard.offerExpiredHint', {
                  defaultValue: 'Die Angebotsfrist ist abgelaufen. Melde dich bei uns, wenn du trotzdem buchen möchtest.',
                })}
              </p>
            )}

            {/* Bezahlt: Betrag, Datum, Belege. */}
            {payment && (payment.status === 'paid' || payment.status === 'refunded') && (
              <PaymentSummary payment={payment} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Event nach der Zahlung. Bei einem stornierten Auftrag bleibt die
          Karte weg: Die Sichtbarkeit eines abgesagten Events soll die Brand
          nicht mehr umschalten können. */}
      {order.eventId && order.status !== 'cancelled' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('brandDashboard.eventVisibilityTitle', { defaultValue: 'Dein Event' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('brandDashboard.eventVisibilityDesc', {
                defaultValue:
                  'Standardmäßig sehen nur die eingeladenen Creator das Event. Der Inhaber kann es auch öffentlich machen, dann erscheint es nach unserer Freigabe in der Eventsuche.',
              })}
            </p>
            {eventQuery.isError && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <span>
                  {t('brandDashboard.visibilityLoadFailed', {
                    defaultValue: 'Die Sichtbarkeit lässt sich gerade nicht laden.',
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={() => eventQuery.refetch()} disabled={eventQuery.isFetching}>
                  {t('common.retry', { defaultValue: 'Erneut versuchen' })}
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentVisibility === 'selected' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                disabled={busy || eventUnknown || !isOwner}
                onClick={() => currentVisibility !== 'selected' && visibility.mutate('selected')}
              >
                <Lock className="h-4 w-4" />
                {t('brandDashboard.visibilityOptionSelected', { defaultValue: 'Nur Creator' })}
              </Button>
              <Button
                variant={currentVisibility === 'public' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                disabled={busy || eventUnknown || !isOwner}
                onClick={() => currentVisibility !== 'public' && visibility.mutate('public')}
              >
                <Globe className="h-4 w-4" />
                {t('brandDashboard.visibilityOptionPublic', { defaultValue: 'Öffentlich' })}
              </Button>
              <div className="flex-1" />
              <Link href={localePath(`/event/${order.eventId}`)}>
                <Button variant="ghost" size="sm" className="gap-2">
                  {t('brandDashboard.openEvent', { defaultValue: 'Event öffnen' })}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {!isOwner && <OwnerOnlyHint />}
            {currentVisibility === 'public' && event && !eventApproved && (
              <p className="text-xs text-muted-foreground">
                {t('brandDashboard.visibilityPublicPending', {
                  defaultValue: 'Das Event wird öffentlich, sobald wir es freigegeben haben.',
                })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Die Besetzung — erst mit dem Angebot. Vorher prüfen wir noch die
          Verfügbarkeit; der Statushinweis sagt das. Das Backend liefert hier
          nur Creator, die zugesagt haben (bzw. bei Altfällen noch offene). */}
      {PROPOSED_VISIBLE_FROM.includes(order.status) && order.proposedCreators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('brandDashboard.bookedCreatorsTitle', { defaultValue: 'Deine Creator' })}
              <span className="text-muted-foreground font-normal">({order.proposedCreators.length})</span>
              {order.responses && order.responses.pending > 0 && (
                <span className="text-sm text-muted-foreground font-normal">
                  ·{' '}
                  {t('brandDashboard.responsesSummary', {
                    accepted: order.responses.accepted,
                    total: responsesTotal,
                    defaultValue: '{{accepted}} von {{total}} zugesagt',
                  })}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {order.status === 'confirmed' || order.status === 'completed'
                ? t('brandDashboard.bookedCreatorsDesc', {
                    defaultValue: 'Diese Creator sind verbindlich für dein Event gebucht.',
                  })
                : t('brandDashboard.acceptedCreatorsDesc', {
                    defaultValue: 'Diese Creator haben für das Event zugesagt. Mit der Zahlung sind sie verbindlich gebucht.',
                  })}
            </p>
            {order.proposedCreators.map((creator) => (
              <CreatorCardRow key={creator.creatorUserId} creator={creator} creatorLabels={creatorLabels} localePath={localePath} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Auftrag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('brandDashboard.campaignSection', { defaultValue: 'Kampagne' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Field label={t('brandDashboard.fieldGoal', { defaultValue: 'Ziel der Kampagne' })}>
            <p className="whitespace-pre-wrap">{order.goal}</p>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Ohne Budget (Entwurf) ein Strich — formatPrice(0) hiesse „0 €". */}
            <Field label={t('brandDashboard.budgetLabel', { defaultValue: 'Budget' })}>
              {order.budget === null ? '—' : formatPrice(order.budget)}
            </Field>
            {order.submittedAt && (
              <Field label={t('brandDashboard.submittedAt', { defaultValue: 'Eingereicht am' })}>{formatDateTime(order.submittedAt)}</Field>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('brandDashboard.eventSection', { defaultValue: 'Event' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* Das Eventbild aus dem Entwurf — es wird mit der Zahlung zum
              Bild des Events. Im Entwurf ohne Bild ein Hinweis, weil das
              Einreichen daran scheitert. */}
          {order.eventImageUrl ? (
            <Field label={t('brandDashboard.fieldEventImage', { defaultValue: 'Eventbild' })}>
              <img
                src={resolveImageUrl(order.eventImageUrl)}
                alt={order.eventName || order.title}
                className="w-full max-w-md aspect-video object-cover rounded-md border mt-1"
              />
            </Field>
          ) : (
            order.status === 'draft' && (
              <Field label={t('brandDashboard.fieldEventImage', { defaultValue: 'Eventbild' })}>
                <p className="text-muted-foreground">
                  {t('brandDashboard.noEventImageYet', { defaultValue: 'Noch kein Eventbild. Zum Einreichen brauchen wir eines.' })}
                </p>
              </Field>
            )
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('brandDashboard.fieldEventName', { defaultValue: 'Name des Events' })}>{order.eventName}</Field>
            {/* Ohne Uhrzeit (Mitternacht in Wien) nur das Datum — „00:00" wäre eine Scheinangabe. */}
            <Field label={t('brandDashboard.fieldEventDate', { defaultValue: 'Beginn' })}>
              {order.eventDate ? formatDateTimeSmart(order.eventDate) : '—'}
              {order.eventEndDate ? ` – ${formatDateTimeSmart(order.eventEndDate)}` : ''}
            </Field>
            {order.eventLocation && (
              <Field label={t('brandDashboard.fieldEventLocation', { defaultValue: 'Ort' })}>
                {order.eventLocation}
                {order.eventCoordinates && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Check className="h-3 w-3" />
                    {t('brandDashboard.addressRecognized', { defaultValue: 'Adresse erkannt' })}
                  </div>
                )}
              </Field>
            )}
          </div>
          {order.eventDescription && (
            <Field label={t('brandDashboard.fieldEventDescription', { defaultValue: 'Beschreibung' })}>
              <p className="whitespace-pre-wrap">{order.eventDescription}</p>
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            {t('brandDashboard.deliverablesSection', { defaultValue: 'Gewünschte Inhalte' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <ul className="list-disc pl-5 space-y-1">
            {order.deliverables.map((entry, index) => (
              <li key={`${entry.type}-${index}`}>
                {entry.quantity}× {labels.deliverable(entry.type)}
                {entry.platform ? ` (${labels.platform(entry.platform)})` : ''}
                {entry.notes ? <span className="text-muted-foreground"> – {entry.notes}</span> : null}
              </li>
            ))}
          </ul>
          <div className="grid sm:grid-cols-2 gap-4">
            {(order.audienceAgeFrom !== null || order.audienceAgeTo !== null || order.audienceGender !== 'all' || order.audienceRegion || order.audienceInterests.length > 0) && (
              <Field label={t('brandDashboard.audienceLabel', { defaultValue: 'Zielgruppe' })}>
                {order.audienceAgeFrom !== null || order.audienceAgeTo !== null
                  ? `${order.audienceAgeFrom ?? '?'}–${order.audienceAgeTo ?? '?'} ${t('brandDashboard.years', { defaultValue: 'Jahre' })}, `
                  : ''}
                {labels.gender(order.audienceGender)}
                {order.audienceRegion ? ` · ${order.audienceRegion}` : ''}
                {order.audienceInterests.length > 0 && <div className="text-muted-foreground">{order.audienceInterests.join(', ')}</div>}
              </Field>
            )}
            <Field label={t('brandDashboard.termsSection', { defaultValue: 'Rahmenbedingungen' })}>
              <div>
                {order.brandMayReuse
                  ? t('brandDashboard.reuseYes', { defaultValue: 'Inhalte dürfen weiterverwendet werden' })
                  : t('brandDashboard.reuseNo', { defaultValue: 'Keine Weiterverwendung der Inhalte' })}
              </div>
              {order.usageNotes && <div className="text-muted-foreground">{order.usageNotes}</div>}
              <div>
                {order.approvalRequired
                  ? t('brandDashboard.approvalYes', { defaultValue: 'Freigabe vor Veröffentlichung' })
                  : t('brandDashboard.approvalNo', { defaultValue: 'Keine Freigabe nötig' })}
              </div>
              {order.publishDeadline && (
                <div>
                  {t('brandDashboard.fieldDeadline', { defaultValue: 'Veröffentlichung bis' })}: {formatDate(order.publishDeadline)}
                </div>
              )}
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Bestätigungen */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('brandDashboard.submitConfirmTitle', { defaultValue: 'Auftrag einreichen?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('brandDashboard.submitConfirmDesc', {
                defaultValue: 'Danach kannst du den Auftrag nicht mehr selbst ändern. Wir prüfen ihn und schicken dir ein Angebot.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit.mutate()}>
              {t('brandDashboard.submitOrder', { defaultValue: 'Einreichen' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stornieren ist endgültig: Rückfrage mit freiwilligem Grund. Der Grund
          geht als Variable mit, der Dialog leert ihn beim Schliessen. */}
      <AlertDialog
        open={confirmCancel}
        onOpenChange={(open) => {
          setConfirmCancel(open)
          if (!open) setCancelReason('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{cancelTitle}</AlertDialogTitle>
            <AlertDialogDescription>{cancelDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancelReason">{t('brandDashboard.cancelReasonLabel', { defaultValue: 'Grund (optional)' })}</Label>
            <Textarea
              id="cancelReason"
              rows={3}
              maxLength={1000}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            {/* Nur das Ablehnen eines Angebots meldet „Angebot abgelehnt"; ein
                abgebrochener Checkout ist schlicht ein stornierter Auftrag. */}
            <AlertDialogAction onClick={() => cancel.mutate({ reason: cancelReason, fromOffer: order.status === 'offer_sent' })}>
              {cancelLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-0.5">{label}</div>
      <div>{children}</div>
    </div>
  )
}

/** „Gültig noch 3 Tage 4 Std" — die Angebotsfrist, laufend aktualisiert. */
function OfferDeadline({ expiresAt }: { expiresAt: string }) {
  const { t } = useTranslation()
  const remaining = useCountdown(expiresAt)
  if (!remaining) return null

  const units: RemainingUnits = {
    day: t('brandDashboard.unitDay', { defaultValue: 'Tag' }),
    days: t('brandDashboard.unitDays', { defaultValue: 'Tage' }),
    hour: t('brandDashboard.unitHour', { defaultValue: 'Std' }),
    hours: t('brandDashboard.unitHours', { defaultValue: 'Std' }),
    minute: t('brandDashboard.unitMinute', { defaultValue: 'Min' }),
    minutes: t('brandDashboard.unitMinutes', { defaultValue: 'Min' }),
  }
  const urgent = !remaining.expired && remaining.totalMs < 24 * 60 * 60 * 1000

  return (
    <div className={`flex items-center gap-2 text-sm ${urgent ? 'text-orange-700' : 'text-muted-foreground'}`}>
      <Clock className="h-4 w-4 shrink-0" />
      {remaining.expired
        ? t('brandDashboard.offerExpired', { defaultValue: 'Angebot abgelaufen' })
        : t('brandDashboard.offerValidFor', {
            remaining: formatRemaining(remaining, units),
            date: formatDateTime(expiresAt),
            defaultValue: 'Gültig noch {{remaining}} (bis {{date}})',
          })}
    </div>
  )
}

/** Bezahlt: Betrag, Datum, Zahlungsart und die Belege von Stripe. */
function PaymentSummary({ payment }: { payment: NonNullable<BrandOrder['payment']> }) {
  const { t } = useTranslation()
  const labels = useBrandLabels()
  const refunded = payment.status === 'refunded'

  return (
    <div className={`rounded-md border p-3 text-sm space-y-2 ${refunded ? 'bg-muted/40' : 'border-green-200 bg-green-50/60'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {refunded ? <Receipt className="h-4 w-4 text-muted-foreground" /> : <Check className="h-4 w-4 text-green-700" />}
        <span className="font-medium">
          {refunded
            ? t('brandDashboard.refundedAt', {
                amount: formatPrice(payment.amount),
                date: payment.refundedAt ? formatDate(payment.refundedAt) : '',
                defaultValue: '{{amount}} erstattet am {{date}}',
              })
            : t('brandDashboard.paidAt', {
                amount: formatPrice(payment.amount),
                date: payment.paidAt ? formatDate(payment.paidAt) : '',
                defaultValue: '{{amount}} bezahlt am {{date}}',
              })}
        </span>
        {payment.provider === 'external' ? (
          <Badge variant="outline" className="font-normal">
            {t('brandDashboard.paidExternally', { defaultValue: 'per Überweisung' })}
          </Badge>
        ) : (
          payment.paymentMethod && (
            <Badge variant="outline" className="font-normal">
              {labels.paymentMethod(payment.paymentMethod)}
            </Badge>
          )
        )}
      </div>
      {(payment.invoiceUrl || payment.invoicePdfUrl || payment.receiptUrl) && (
        <div className="flex flex-wrap gap-3 text-primary">
          {payment.invoiceUrl && (
            <SafeStripeLink href={payment.invoiceUrl}>{t('brandDashboard.invoice', { defaultValue: 'Rechnung' })}</SafeStripeLink>
          )}
          {payment.invoicePdfUrl && (
            <SafeStripeLink href={payment.invoicePdfUrl}>{t('brandDashboard.invoicePdf', { defaultValue: 'Rechnung (PDF)' })}</SafeStripeLink>
          )}
          {payment.receiptUrl && (
            <SafeStripeLink href={payment.receiptUrl}>{t('brandDashboard.receipt', { defaultValue: 'Zahlungsbeleg' })}</SafeStripeLink>
          )}
        </div>
      )}
    </div>
  )
}

/** Nur HTTPS-Links zu Stripe — kommt der Link von anderswo, bleibt er weg. */
function SafeStripeLink({ href, children }: { href: string; children: React.ReactNode }) {
  let allowed = false
  try {
    const parsed = new URL(href)
    const host = parsed.hostname.toLowerCase()
    allowed = parsed.protocol === 'https:' && STRIPE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    allowed = false
  }
  if (!allowed) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )
}

function CreatorCardRow({
  creator,
  creatorLabels,
  localePath,
}: {
  creator: ProposedCreatorCard
  creatorLabels: ReturnType<typeof useCreatorLabels>
  localePath: (path: string) => string
}) {
  const { t } = useTranslation()
  // Abgesagt oder abgelaufen zeigt das Backend der Brand gar nicht; eine
  // Zusage ist der Normalfall und braucht kein Badge — nur Offenes (Altfall).
  const badge = creator.response === 'pending' ? <ResponseBadge value={creator.response} /> : null

  return (
    <div className="flex gap-3 rounded-md border p-3">
      {creator.released ? (
        <>
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={resolveImageUrl(creator.profileImage)} alt={creator.name} />
            <AvatarFallback className="gradient-bg text-white">{getInitials(creator.name || '?')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={localePath(`/user/${creator.creatorUserId}`)} className="font-medium hover:underline">
                {creator.name || t('brandDashboard.creatorUnnamed', { defaultValue: 'Creator' })}
              </Link>
              {badge}
              {creator.city && <span className="text-sm text-muted-foreground">{creator.city}</span>}
            </div>
            {creator.channels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {creator.channels.map((channel, index) => (
                  <Badge key={`${channel.platform}-${index}`} variant="secondary" className="font-normal">
                    {channel.url ? (
                      <a href={channel.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {creatorLabels.platform(channel.platform)}: @{channel.username}
                      </a>
                    ) : (
                      <>
                        {creatorLabels.platform(channel.platform)}: @{channel.username}
                      </>
                    )}
                    {channel.followerRange ? ` · ${creatorLabels.followerRange(channel.followerRange)}` : ''}
                  </Badge>
                ))}
              </div>
            )}
            {creator.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {creator.categories.map((category) => (
                  <Badge key={category} variant="outline" className="font-normal">
                    {creatorLabels.category(category)}
                  </Badge>
                ))}
              </div>
            )}
            {creator.bio && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{creator.bio}</p>}
            {creator.portfolioLinks.length > 0 && (
              <div className="text-sm space-x-3">
                {creator.portfolioLinks.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {t('brandDashboard.portfolio', { defaultValue: 'Portfolio' })}
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <EyeOff className="h-5 w-5 shrink-0" />
          <span className="flex-1 min-w-0">
            {t('brandDashboard.creatorNotReleased', {
              defaultValue: 'Dieser Creator hat sein Profil noch nicht für Brands freigegeben. Details folgen mit dem Briefing.',
            })}
          </span>
          {badge}
        </div>
      )}
    </div>
  )
}

/** Ein Satz dazu, was gerade passiert und was als Nächstes kommt. */
function StatusHint({
  order,
  returnState,
  pollsExhausted,
  checking,
  onCheckPayment,
  isOwner,
}: {
  order: BrandOrder
  returnState: 'success' | 'cancelled' | null
  /** Das automatische Nachfragen bei Stripe hat aufgegeben; die Brand kann von Hand prüfen. */
  pollsExhausted: boolean
  checking: boolean
  onCheckPayment: () => void
  isOwner: boolean
}) {
  const { t } = useTranslation()
  const { cancellation, responses, payment } = order

  // Storniert: von der Brand selbst, von uns oder vom System (Frist), mit
  // Datum, wenn bekannt.
  const cancelledAt = cancellation?.at ? formatDate(cancellation.at) : ''
  const cancelledText =
    cancellation?.by === 'brand'
      ? cancelledAt
        ? t('brandDashboard.hintCancelledByBrandAt', { date: cancelledAt, defaultValue: 'Die Brand hat diesen Auftrag am {{date}} storniert.' })
        : t('brandDashboard.hintCancelledByBrand', { defaultValue: 'Die Brand hat diesen Auftrag storniert.' })
      : cancellation?.by === 'system'
        ? t('brandDashboard.hintCancelledExpired', {
            defaultValue:
              'Die Angebotsfrist ist abgelaufen, der Auftrag wurde deshalb storniert und die Creator wieder freigegeben. Melde dich bei uns, wenn du trotzdem buchen möchtest.',
          })
        : cancelledAt
          ? t('brandDashboard.hintCancelledAt', { date: cancelledAt, defaultValue: 'Dieser Auftrag wurde am {{date}} storniert.' })
          : t('brandDashboard.hintCancelled', { defaultValue: 'Dieser Auftrag wurde storniert.' })
  // Storniert, obwohl schon bezahlt (etwa durch uns nach der Zahlung): Die
  // Brand soll wissen, dass ihr Geld nicht verloren ist.
  const cancelledPaidText =
    payment?.status === 'paid'
      ? t('brandDashboard.hintCancelledPaidRefundPending', {
          defaultValue: 'Die Zahlung ist eingegangen; die Rückerstattung folgt, wir melden uns.',
        })
      : ''

  // Angebot: Nach einem gescheiterten oder abgelaufenen Checkout setzt das
  // Backend den Auftrag auf offer_sent zurück; der Zahlungsstand sagt dann,
  // was war.
  const offerSentText =
    payment?.status === 'failed'
      ? t('brandDashboard.hintAwaitingFailed', {
          defaultValue: 'Die Zahlung ist fehlgeschlagen. Der Inhaber kann es erneut versuchen – das Angebot gilt weiterhin bis zur Frist.',
        })
      : payment?.status === 'expired'
        ? t('brandDashboard.hintOfferSentExpiredCheckout', {
            defaultValue: 'Die Zahlungsseite ist abgelaufen. Der Inhaber kann die Zahlung neu starten, solange das Angebot gilt.',
          })
        : t('brandDashboard.hintOfferSent', {
            defaultValue:
              'Unser Angebot liegt vor: Die Creator unten haben für das Event zugesagt. Sobald der Inhaber es annimmt und bezahlt, sind sie verbindlich gebucht und das Event ist angelegt.',
          })

  // Zahlung: Was gerade los ist, hängt am Zahlungsstand, nicht nur am Status.
  // Nach der Rückkehr aus dem Checkout fragt die Seite bei Stripe nach; gibt
  // sie auf, bekommt die Brand einen Knopf zum Nachprüfen.
  const awaitingUnconfirmed = returnState === 'success' && payment?.status === 'pending' && pollsExhausted
  const awaitingText =
    payment?.status === 'processing'
      ? t('brandDashboard.hintAwaitingProcessing', {
          defaultValue:
            'Die Zahlung wird verarbeitet. Sobald das Geld eingegangen ist, sind die Creator verbindlich gebucht und das Event ist angelegt – wir melden uns.',
        })
      : payment?.status === 'failed'
        ? t('brandDashboard.hintAwaitingFailed', {
            defaultValue: 'Die Zahlung ist fehlgeschlagen. Der Inhaber kann es erneut versuchen – das Angebot gilt weiterhin bis zur Frist.',
          })
        : awaitingUnconfirmed
          ? t('brandDashboard.hintAwaitingUnconfirmed', {
              defaultValue: 'Noch nicht bestätigt. Prüfe den Zahlungsstand oder melde dich bei uns.',
            })
          : returnState === 'success'
            ? t('brandDashboard.hintAwaitingSuccess', {
                defaultValue: 'Danke! Wir warten auf die Bestätigung von Stripe – das dauert meist nur Sekunden.',
              })
            : t('brandDashboard.hintAwaitingPending', {
                defaultValue: 'Die Zahlung ist noch offen. Erst mit ihrem Abschluss sind die Creator verbindlich gebucht.',
              })

  // Bestätigt: Event und Buchung entstehen nach der Zahlung. Scheitert das
  // (provisioning 'failed'), bleibt der Auftrag bezahlt und wir holen es
  // nach — die Brand soll wissen, wohin sie sich wenden kann.
  const provisioningOpen = order.provisioning !== null && order.provisioning !== 'done'
  const confirmedText =
    order.provisioning === 'failed'
      ? t('brandDashboard.hintConfirmedProvisioningFailed', {
          defaultValue:
            'Zahlung eingegangen. Event und Buchung werden gerade nachgeholt – falls das länger dauert, melde dich bei office@shareyourparty.de.',
        })
      : provisioningOpen
        ? pollsExhausted
          ? t('brandDashboard.hintConfirmedProvisioningSlow', {
              defaultValue:
                'Zahlung eingegangen. Event und Buchung brauchen gerade etwas länger – prüfe den Stand oder melde dich bei office@shareyourparty.de.',
            })
          : t('brandDashboard.hintConfirmedProvisioning', {
              defaultValue: 'Zahlung eingegangen, danke! Wir legen gerade dein Event und die Buchung der Creator an.',
            })
        : t('brandDashboard.hintConfirmed', {
            defaultValue:
              'Bezahlt und gebucht. Dein Event ist angelegt und die Creator sind verbindlich dabei – das Briefing haben sie bekommen. Eine Absage ist ab jetzt nur noch über uns möglich (mit Rückerstattung), damit wir die Creator persönlich informieren können.',
          })

  // Der Knopf zum Nachprüfen, wenn das automatische Nachfragen aufgegeben hat.
  const showCheckPayment =
    isOwner &&
    ((order.status === 'awaiting_payment' && awaitingUnconfirmed) ||
      (order.status === 'confirmed' && provisioningOpen && pollsExhausted))

  const text = {
    draft: t('brandDashboard.hintDraft', {
      defaultValue: 'Dieser Auftrag ist ein Entwurf. Alle Personen der Brand sehen ihn, einreichen kann ihn nur der Inhaber.',
    }),
    submitted: t('brandDashboard.hintSubmitted', {
      defaultValue: 'Der Auftrag ist bei uns eingegangen. Wir prüfen ihn und suchen passende Creator.',
    }),
    in_review: t('brandDashboard.hintInReview', {
      defaultValue: 'Wir prüfen den Auftrag gerade und stellen Creator zusammen. Das Angebot folgt in Kürze.',
    }),
    creators_requested: t('brandDashboard.hintCreatorsRequested', {
      defaultValue:
        'Wir fragen gerade passende Creator nach ihrer Verfügbarkeit. Sobald Zusagen vorliegen, folgt ein Angebot – nur mit Creatorn, die wirklich dabei sind.',
    }),
    offer_sent: offerSentText,
    awaiting_payment: awaitingText,
    confirmed: confirmedText,
    completed: t('brandDashboard.hintCompleted', { defaultValue: 'Dieser Auftrag ist abgeschlossen. Danke für die Zusammenarbeit!' }),
    cancelled: cancelledText,
  }[order.status]

  if (!text) return null

  // Bestätigt (Altfall mit offenen Antworten): der Stand der Zu- und Absagen.
  const responsesText =
    order.status === 'confirmed' && responses && responses.pending > 0
      ? t('brandDashboard.hintResponses', {
          accepted: responses.accepted,
          declined: responses.declined,
          pending: responses.pending,
          defaultValue: 'Stand: {{accepted}} Zusagen, {{declined}} Absagen, {{pending}} offen.',
        })
      : ''
  const reason = order.status === 'cancelled' && cancellation?.by !== 'system' ? cancellation?.reason : ''

  const Icon =
    order.status === 'offer_sent'
      ? Eye
      : order.status === 'awaiting_payment'
        ? CreditCard
        : order.status === 'confirmed'
          ? Check
          : order.status === 'creators_requested'
            ? Users
            : FileText

  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm">
      <Icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
      <div className="space-y-1 flex-1 min-w-0">
        <p>
          {text}
          {responsesText ? ` ${responsesText}` : ''}
          {order.status === 'cancelled' && cancelledPaidText ? ` ${cancelledPaidText}` : ''}
        </p>
        {reason && <p className="text-muted-foreground whitespace-pre-wrap">„{reason}“</p>}
        {showCheckPayment && (
          <div className="pt-1">
            <Button variant="outline" size="sm" className="gap-2" loading={checking} onClick={onCheckPayment}>
              <RefreshCw className="h-4 w-4" />
              {t('brandDashboard.checkPayment', { defaultValue: 'Zahlungsstand prüfen' })}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
