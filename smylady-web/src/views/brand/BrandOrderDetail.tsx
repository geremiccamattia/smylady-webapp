'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
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
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { brandService, readBrandError, type BrandOrder } from '@/services/brand'
import { eventsService } from '@/services/events'
import { formatDate, formatDateTime, formatPrice, getInitials, resolveImageUrl } from '@/lib/utils'
import { BrandGate, LoadingBars, OrderStatusBadge, useBrandLabels } from '@/components/brand/brandShared'
import { BRAND_ORDERS_QUERY_KEY } from './BrandDashboard'

/**
 * Ein Auftrag aus Sicht der Brand.
 *
 * Je nach Status gibt es eine Aktion:
 *   draft       — bearbeiten oder einreichen
 *   submitted / in_review — warten, wir prüfen
 *   offer_sent  — Angebot mit Preis ansehen, vorgeschlagene Creator prüfen,
 *                 annehmen (legt Event und Creator-Auftrag an)
 *   confirmed   — Event für Explore öffentlich machen oder nur für die Creator
 *   completed / cancelled — nur Ansicht
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
  const { id } = useParams<{ id: string }>()
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

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
    onError: (error: unknown) => fail(error, t('brandDashboard.submitFailed', { defaultValue: 'Der Auftrag konnte nicht eingereicht werden.' })),
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
  const busy = submit.isPending || accept.isPending || visibility.isPending

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
          {order.status === 'draft' && (
            <div className="flex gap-2">
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
            </div>
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
                <Button variant="gradient" className="gap-2" loading={accept.isPending} onClick={() => setConfirmAccept(true)}>
                  <Check className="h-4 w-4" />
                  {t('brandDashboard.acceptOffer', { defaultValue: 'Angebot annehmen' })}
                </Button>
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

      {/* Event nach Annahme */}
      {order.eventId && (
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

      {/* Vorgeschlagene Creator */}
      {order.proposedCreators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('brandDashboard.proposedTitle', { defaultValue: 'Vorgeschlagene Creator' })}
              <span className="text-muted-foreground font-normal">({order.proposedCreators.length})</span>
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
                        {creator.city && <span className="text-sm text-muted-foreground">{creator.city}</span>}
                      </div>
                      {creator.channels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {creator.channels.map((channel, index) => (
                            <Badge key={`${channel.platform}-${index}`} variant="secondary" className="font-normal">
                              {channel.url ? (
                                <a href={channel.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {channel.platform}: @{channel.username}
                                </a>
                              ) : (
                                <>
                                  {channel.platform}: @{channel.username}
                                </>
                              )}
                              {channel.followerRange ? ` · ${channel.followerRange}` : ''}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {creator.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {creator.categories.map((category) => (
                            <Badge key={category} variant="outline" className="font-normal">
                              {category}
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <EyeOff className="h-5 w-5 shrink-0" />
                    {t('brandDashboard.creatorNotReleased', {
                      defaultValue: 'Dieser Creator hat sein Profil noch nicht für Brands freigegeben. Details folgen mit dem Briefing.',
                    })}
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
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('brandDashboard.fieldEventName', { defaultValue: 'Name des Events' })}>{order.eventName}</Field>
            <Field label={t('brandDashboard.fieldEventDate', { defaultValue: 'Beginn' })}>
              {order.eventDate ? formatDateTime(order.eventDate) : '—'}
              {order.eventEndDate ? ` – ${formatDateTime(order.eventEndDate)}` : ''}
            </Field>
            {order.eventLocation && <Field label={t('brandDashboard.fieldEventLocation', { defaultValue: 'Ort' })}>{order.eventLocation}</Field>}
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
                {entry.platform ? ` (${entry.platform})` : ''}
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
    confirmed: t('brandDashboard.hintConfirmed', {
      defaultValue: 'Angebot angenommen. Dein Event ist angelegt, die Creator wurden informiert und melden sich mit Zu- oder Absage.',
    }),
    completed: t('brandDashboard.hintCompleted', { defaultValue: 'Dieser Auftrag ist abgeschlossen.' }),
    cancelled: t('brandDashboard.hintCancelled', { defaultValue: 'Dieser Auftrag wurde storniert.' }),
  }[order.status]

  if (!text) return null

  const Icon = order.status === 'offer_sent' ? Eye : order.status === 'confirmed' ? Check : FileText

  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm">
      <Icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
      <p>{text}</p>
    </div>
  )
}
