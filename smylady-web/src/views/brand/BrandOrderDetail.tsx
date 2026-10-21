'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  Clapperboard,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Lock,
  Pencil,
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
import { brandService, readBrandError, readMissingFields, type BrandOrder } from '@/services/brand'
import { eventsService } from '@/services/events'
import { formatDate, formatDateTime, formatPrice, getInitials, resolveImageUrl } from '@/lib/utils'
import { BrandGate, LoadingBars, OrderStatusBadge, useBrandLabels } from '@/components/brand/brandShared'
import { ResponseBadge, useCreatorLabels } from '@/components/creator/creatorShared'
import { BRAND_ORDERS_QUERY_KEY } from './BrandDashboard'

/** Ab diesen Status ist die Creator-Auswahl fix und darf der Brand gezeigt werden. */
const PROPOSED_VISIBLE_FROM: BrandOrder['status'][] = ['offer_sent', 'confirmed', 'completed']

/** Bis hierhin beendet die Brand den Auftrag selbst; ab 'confirmed' nur noch über uns (409). */
const CANCELLABLE: BrandOrder['status'][] = ['draft', 'submitted', 'in_review', 'offer_sent']

/**
 * Ein Auftrag aus Sicht der Brand.
 *
 * Je nach Status gibt es eine Aktion:
 *   draft       — bearbeiten, einreichen oder verwerfen
 *   submitted / in_review — warten, wir prüfen; oder zurückziehen
 *   offer_sent  — Angebot mit Preis ansehen, vorgeschlagene Creator prüfen,
 *                 annehmen (legt Event und Creator-Auftrag an) oder ablehnen
 *   confirmed   — Event für Explore öffentlich machen oder nur für die Creator;
 *                 Zu- und Absagen der Creator mitlesen
 *   completed / cancelled — nur Ansicht
 *
 * Verwerfen, Zurückziehen und Ablehnen sind dieselbe Stornierung
 * (POST /:id/cancel) mit freiwilligem Grund — endgültig, deshalb mit Rückfrage.
 */
export default function BrandOrderDetail() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BrandGate>
        <OrderDetail />
      </BrandGate>
    </div>
  )
}

function OrderDetail() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const labels = useBrandLabels()
  // Die Creator-Karten zeigen Enum-Werte des Creator-Profils (Plattform,
  // Follower-Bereich, Kategorie); die Beschriftung kommt aus dem Creator-Bereich.
  const creatorLabels = useCreatorLabels()
  const { id } = useParams<{ id: string }>()
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

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

  const applyUpdate = (updated: BrandOrder) => {
    queryClient.setQueryData(['brand', 'order', id], updated)
    queryClient.invalidateQueries({ queryKey: BRAND_ORDERS_QUERY_KEY })
  }

  const fail = (error: unknown, fallback: string) =>
    toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }), description: readBrandError(error, fallback) })

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

  const accept = useMutation({
    mutationFn: () => brandService.acceptOffer(id),
    onSuccess: (updated) => {
      applyUpdate(updated)
      toast({
        title: t('brandDashboard.acceptedTitle', { defaultValue: 'Angebot angenommen' }),
        description: t('brandDashboard.acceptedDesc', {
          defaultValue: 'Dein Event und das Briefing für die Creator sind angelegt. Die Creator werden jetzt benachrichtigt.',
        }),
      })
    },
    onError: (error: unknown) => fail(error, t('brandDashboard.acceptFailed', { defaultValue: 'Das Angebot konnte nicht angenommen werden.' })),
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
  const busy = submit.isPending || accept.isPending || visibility.isPending || cancel.isPending

  // Stornieren heisst je nach Status etwas anderes; Wortwahl und Icon folgen dem.
  const canCancel = CANCELLABLE.includes(order.status)
  const cancelLabel =
    order.status === 'draft'
      ? t('brandDashboard.cancelDraft', { defaultValue: 'Entwurf verwerfen' })
      : order.status === 'offer_sent'
        ? t('brandDashboard.declineOffer', { defaultValue: 'Angebot ablehnen' })
        : t('brandDashboard.withdrawOrder', { defaultValue: 'Auftrag zurückziehen' })
  const cancelTitle =
    order.status === 'draft'
      ? t('brandDashboard.cancelDraftConfirmTitle', { defaultValue: 'Entwurf verwerfen?' })
      : order.status === 'offer_sent'
        ? t('brandDashboard.declineOfferConfirmTitle', { defaultValue: 'Angebot ablehnen?' })
        : t('brandDashboard.withdrawConfirmTitle', { defaultValue: 'Auftrag zurückziehen?' })
  const cancelDescription =
    order.status === 'draft'
      ? t('brandDashboard.cancelDraftConfirmDesc', {
          defaultValue:
            'Der Entwurf wird storniert und lässt sich danach weder bearbeiten noch einreichen. Das lässt sich nicht rückgängig machen.',
        })
      : order.status === 'offer_sent'
        ? t('brandDashboard.declineOfferConfirmDesc', {
            defaultValue:
              'Der Auftrag wird storniert, die vorgeschlagenen Creator werden nicht gebucht. Das lässt sich nicht rückgängig machen – für ein neues Angebot leg bitte einen neuen Auftrag an.',
          })
        : t('brandDashboard.withdrawConfirmDesc', {
            defaultValue:
              'Wir stoppen die Bearbeitung und der Auftrag wird storniert. Das lässt sich nicht rückgängig machen – ein neuer Auftrag ist jederzeit möglich.',
          })
  // Derselbe Knopf im Kopf der Seite und, beim Angebot, noch einmal in der Angebotskarte.
  const cancelButton = canCancel ? (
    <Button variant="outline" className="gap-2" disabled={busy} loading={cancel.isPending} onClick={() => setConfirmCancel(true)}>
      {order.status === 'offer_sent' ? <X className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
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
              <Button variant="gradient" className="gap-2" loading={submit.isPending} onClick={() => setConfirmSubmit(true)}>
                <Send className="h-4 w-4" />
                {t('brandDashboard.submitOrder', { defaultValue: 'Einreichen' })}
              </Button>
              {cancelButton}
            </div>
          ) : (
            // Eingereicht, in Prüfung, Angebot: Zurückziehen bzw. Ablehnen
            // ist die einzige Aktion im Kopf. Ab 'confirmed' null.
            cancelButton
          )}
        </div>
      </div>

      {/* Statushinweis */}
      <StatusHint order={order} />

      {/* Angebot */}
      {order.offerPrice !== null && (
        <Card className={order.status === 'offer_sent' ? 'border-purple-200 bg-purple-50/40' : undefined}>
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
            {order.status === 'offer_sent' && (
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="gradient" className="gap-2" loading={accept.isPending} onClick={() => setConfirmAccept(true)}>
                    <Check className="h-4 w-4" />
                    {t('brandDashboard.acceptOffer', { defaultValue: 'Angebot annehmen' })}
                  </Button>
                  {cancelButton}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('brandDashboard.acceptHint', {
                    defaultValue: 'Mit der Annahme legen wir dein Event an und informieren die vorgeschlagenen Creator.',
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event nach Annahme. Bei einem stornierten Auftrag bleibt die Karte
          weg: Die Sichtbarkeit eines abgesagten Events soll die Brand nicht
          mehr umschalten können. */}
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
                  'Standardmäßig sehen nur die eingeladenen Creator das Event. Du kannst es auch öffentlich machen, dann erscheint es nach unserer Freigabe in der Eventsuche.',
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
                disabled={busy || eventUnknown}
                onClick={() => currentVisibility !== 'selected' && visibility.mutate('selected')}
              >
                <Lock className="h-4 w-4" />
                {t('brandDashboard.visibilityOptionSelected', { defaultValue: 'Nur Creator' })}
              </Button>
              <Button
                variant={currentVisibility === 'public' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                disabled={busy || eventUnknown}
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

      {/* Vorgeschlagene Creator — erst mit dem Angebot. Vorher stellt der
          Admin die Auswahl noch zusammen; der Statushinweis sagt "Angebot
          folgt", da wäre eine halbfertige Liste widersprüchlich. */}
      {PROPOSED_VISIBLE_FROM.includes(order.status) && order.proposedCreators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('brandDashboard.proposedTitle', { defaultValue: 'Vorgeschlagene Creator' })}
              <span className="text-muted-foreground font-normal">({order.proposedCreators.length})</span>
              {order.responses && (
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
            {order.proposedCreators.map((creator) => (
              <div key={creator.creatorUserId} className="flex gap-3 rounded-md border p-3">
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
                        {creator.response && <ResponseBadge value={creator.response} />}
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
                    {/* Die Antwort kommt auch ohne Freigabe — sie verrät nichts über die Person. */}
                    {creator.response && <ResponseBadge value={creator.response} />}
                  </div>
                )}
              </div>
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
            <Field label={t('brandDashboard.budgetLabel', { defaultValue: 'Budget' })}>{formatPrice(order.budget)}</Field>
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
          {/* Das Eventbild aus dem Entwurf — es wird beim Annehmen des
              Angebots zum Bild des Events. Im Entwurf ohne Bild ein Hinweis,
              weil das Einreichen daran scheitert. */}
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
            <Field label={t('brandDashboard.fieldEventDate', { defaultValue: 'Beginn' })}>
              {order.eventDate ? formatDateTime(order.eventDate) : '—'}
              {order.eventEndDate ? ` – ${formatDateTime(order.eventEndDate)}` : ''}
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

      <AlertDialog open={confirmAccept} onOpenChange={setConfirmAccept}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('brandDashboard.acceptConfirmTitle', { defaultValue: 'Angebot annehmen?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('brandDashboard.acceptConfirmDesc', {
                price: formatPrice(order.offerPrice ?? 0),
                defaultValue:
                  'Du bestätigst das Angebot über {{price}}. Wir legen dein Event an und informieren die vorgeschlagenen Creator.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            <AlertDialogAction onClick={() => accept.mutate()}>
              {t('brandDashboard.acceptOffer', { defaultValue: 'Angebot annehmen' })}
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

/** Ein Satz dazu, was gerade passiert und was als Nächstes kommt. */
function StatusHint({ order }: { order: BrandOrder }) {
  const { t } = useTranslation()
  const { cancellation, responses } = order

  // Storniert: von der Brand selbst oder von uns, mit Datum, wenn bekannt.
  const cancelledAt = cancellation?.at ? formatDate(cancellation.at) : ''
  const cancelledText =
    cancellation?.by === 'brand'
      ? cancelledAt
        ? t('brandDashboard.hintCancelledByBrandAt', { date: cancelledAt, defaultValue: 'Du hast diesen Auftrag am {{date}} storniert.' })
        : t('brandDashboard.hintCancelledByBrand', { defaultValue: 'Du hast diesen Auftrag storniert.' })
      : cancelledAt
        ? t('brandDashboard.hintCancelledAt', { date: cancelledAt, defaultValue: 'Dieser Auftrag wurde am {{date}} storniert.' })
        : t('brandDashboard.hintCancelled', { defaultValue: 'Dieser Auftrag wurde storniert.' })

  const text = {
    draft: t('brandDashboard.hintDraft', {
      defaultValue: 'Dieser Auftrag ist ein Entwurf. Nur du siehst ihn. Reiche ihn ein, wenn alles passt.',
    }),
    submitted: t('brandDashboard.hintSubmitted', {
      defaultValue: 'Dein Auftrag ist bei uns eingegangen. Wir prüfen ihn und suchen passende Creator.',
    }),
    in_review: t('brandDashboard.hintInReview', {
      defaultValue: 'Wir prüfen deinen Auftrag gerade und stellen Creator zusammen. Du bekommst in Kürze ein Angebot.',
    }),
    offer_sent: t('brandDashboard.hintOfferSent', {
      defaultValue: 'Unser Angebot liegt vor. Sieh dir Preis und vorgeschlagene Creator an und bestätige, wenn es passt.',
    }),
    // Ab 'confirmed' gibt es keinen Storno-Button mehr (siehe CANCELLABLE).
    // Ohne diesen Satz sucht die Brand ihn vergeblich (Testlauf 17.10., D1).
    confirmed: t('brandDashboard.hintConfirmed', {
      defaultValue:
        'Angebot angenommen. Dein Event ist angelegt, die Creator wurden informiert und melden sich mit Zu- oder Absage. Eine Absage ist ab jetzt nur noch über uns möglich, damit wir die Creator persönlich informieren können.',
    }),
    completed: t('brandDashboard.hintCompleted', { defaultValue: 'Dieser Auftrag ist abgeschlossen.' }),
    cancelled: cancelledText,
  }[order.status]

  if (!text) return null

  // Bestätigt: der Stand der Zu- und Absagen, sobald das Backend ihn liefert.
  const responsesText =
    order.status === 'confirmed' && responses
      ? t('brandDashboard.hintResponses', {
          accepted: responses.accepted,
          declined: responses.declined,
          pending: responses.pending,
          defaultValue: 'Stand: {{accepted}} Zusagen, {{declined}} Absagen, {{pending}} offen.',
        })
      : ''
  const reason = order.status === 'cancelled' ? cancellation?.reason : ''

  const Icon = order.status === 'offer_sent' ? Eye : order.status === 'confirmed' ? Check : FileText

  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm">
      <Icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
      <div className="space-y-1">
        <p>
          {text}
          {responsesText ? ` ${responsesText}` : ''}
        </p>
        {reason && <p className="text-muted-foreground whitespace-pre-wrap">„{reason}“</p>}
      </div>
    </div>
  )
}
