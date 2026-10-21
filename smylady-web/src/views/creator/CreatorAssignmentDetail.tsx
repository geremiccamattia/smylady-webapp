'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Clapperboard, Clock, ExternalLink, FileText, Wallet, X } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import {
  creatorAreaService,
  isCreatorConflict,
  isPaidOut,
  readCreatorConflict,
  readCreatorError,
  type CreatorAssignment,
} from '@/services/creator'
import { formatDate, formatDateTime, formatDateTimeSmart, formatPrice, isEventOver } from '@/lib/utils'
import { formatRemaining, useCountdown, type RemainingUnits } from '@/lib/deadline'
import { LoadingBars } from '@/components/brand/brandShared'
import {
  CreatorGate,
  PastEventBadge,
  PayoutBadge,
  PhaseBadge,
  ResponseBadge,
  useCreatorLabels,
} from '@/components/creator/creatorShared'
import { CREATOR_ASSIGNMENTS_QUERY_KEY } from './CreatorDashboard'

/**
 * Eine Anfrage aus Sicht des Creators: Event, Vergütung, Briefing, gewünschte
 * Inhalte — und die Antwort.
 *
 * Zwei Phasen: Erst die VERFÜGBARKEITSANFRAGE (zusagen oder absagen, mit
 * Frist; verbindlich zur Vergütung, aber noch nicht gebucht), dann die
 * BUCHUNG, sobald die Brand bezahlt hat. Zu- oder Absage sind endgültig; wer
 * sich geirrt hat, meldet sich bei uns (das Backend weist eine zweite
 * Antwort mit 409 ab).
 */
export default function CreatorAssignmentDetail() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <CreatorGate>
        <AssignmentDetail />
      </CreatorGate>
    </div>
  )
}

function AssignmentDetail() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const labels = useCreatorLabels()
  const { id } = useParams<{ id: string }>()
  const [confirm, setConfirm] = useState<'accept' | 'decline' | null>(null)

  const query = useQuery<CreatorAssignment>({
    queryKey: ['creator', 'assignment', id],
    queryFn: () => creatorAreaService.getMyAssignment(id),
    enabled: Boolean(id),
    retry: false,
  })

  const respond = useMutation({
    mutationFn: (answer: 'accept' | 'decline') => creatorAreaService.respond(id, answer),
    onSuccess: (updated, answer) => {
      queryClient.setQueryData(['creator', 'assignment', id], updated)
      queryClient.invalidateQueries({ queryKey: CREATOR_ASSIGNMENTS_QUERY_KEY })
      toast({
        title: answer === 'accept'
          ? t('creatorDashboard.acceptedTitle', { defaultValue: 'Zugesagt' })
          : t('creatorDashboard.declinedTitle', { defaultValue: 'Abgesagt' }),
        description: answer === 'accept'
          ? t('creatorDashboard.acceptedDesc', { defaultValue: 'Danke! Sobald die Brand gebucht hat, bekommst du die Bestätigung mit allen Details.' })
          : t('creatorDashboard.declinedDesc', { defaultValue: 'Schade, vielleicht beim nächsten Mal.' }),
      })
    },
    onError: (error: unknown) => {
      // 409: Es liegt schon eine (andere) Antwort vor, etwa vom Admin per
      // Mail nachgetragen, oder die Frist ist abgelaufen. Die Karte zeigte
      // dann weiter "Offen" mit aktiven Buttons; der echte Stand muss her.
      if (isCreatorConflict(error)) {
        queryClient.invalidateQueries({ queryKey: ['creator', 'assignment', id] })
        queryClient.invalidateQueries({ queryKey: CREATOR_ASSIGNMENTS_QUERY_KEY })
      }
      // Die bekannten 409-Fälle bekommen eine Übersetzung; alles andere
      // zeigt den Text des Backends.
      const conflict = readCreatorConflict(error)
      const description =
        conflict === 'expired'
          ? t('creatorDashboard.conflictExpired', { defaultValue: 'Die Antwortfrist für diese Anfrage ist abgelaufen.' })
          : conflict === 'answered'
            ? t('creatorDashboard.conflictAnswered', { defaultValue: 'Für diese Anfrage liegt bereits eine Antwort vor.' })
            : conflict === 'withdrawn'
              ? t('creatorDashboard.conflictWithdrawn', { defaultValue: 'Diese Anfrage wurde zurückgezogen.' })
              : readCreatorError(error, t('creatorDashboard.respondFailed', { defaultValue: 'Die Antwort konnte nicht gespeichert werden.' }))
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description,
      })
    },
  })

  // Die Antwortfrist läuft live mit: Verstreicht sie, während die Seite
  // offen ist, sperren die Knöpfe, statt in einen 409 zu laufen.
  const deadlineRemaining = useCountdown(query.data?.responseDeadline)
  const overdue = deadlineRemaining?.expired ?? false

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingBars />
        </CardContent>
      </Card>
    )
  }

  const assignment = query.data
  if (query.isError || !assignment) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('creatorDashboard.assignmentLoadFailed', { defaultValue: 'Die Anfrage lässt sich nicht laden.' })}
          </p>
          <Link href={localePath('/creator')}>
            <Button variant="outline">{t('creatorDashboard.backToDashboard', { defaultValue: 'Zurück zur Übersicht' })}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Vergangenes Event: Die Anfrage bleibt sichtbar, aber eine Antwort ändert
  // nichts mehr. Buttons bleiben stehen, damit klar ist, was hier möglich
  // gewesen wäre — nur gesperrt und mit Hinweis. Vorbei ist das Event mit
  // seinem Ende, sonst mit seinem Beginn.
  const eventPast = isEventOver(assignment.eventEndDate || null, assignment.eventDate)
  // Zurückgezogen (nur diese Anfrage) oder der ganze Auftrag storniert.
  const withdrawn = Boolean(assignment.cancelledAt)
  const cancelled = assignment.orderStatus === 'cancelled' || withdrawn
  const pending = assignment.response === 'pending' && !cancelled
  const canAnswer = pending && !eventPast && !overdue
  const booked = assignment.phase === 'booked' && assignment.response === 'accepted' && !cancelled

  return (
    <>
      <div>
        <Link href={localePath('/creator')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" />
          {t('creatorDashboard.backToDashboard', { defaultValue: 'Zurück zur Übersicht' })}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">
            {assignment.eventName || t('creatorDashboard.assignmentUnnamed', { defaultValue: 'Auftrag' })}
          </h1>
          <PhaseBadge assignment={assignment} />
          <ResponseBadge value={assignment.response} />
          <PayoutBadge assignment={assignment} />
          {eventPast && <PastEventBadge />}
        </div>
      </div>

      {/* Antwort bzw. Stand */}
      <Card className={canAnswer ? 'border-yellow-200 bg-yellow-50/40' : booked ? 'border-green-200 bg-green-50/40' : undefined}>
        <CardContent className="p-6 space-y-4">
          {assignment.compensation !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatPrice(assignment.compensation)}</span>
              <span className="text-sm text-muted-foreground">
                {t('creatorDashboard.compensation', { defaultValue: 'Vergütung' })}
              </span>
            </div>
          )}

          {cancelled ? (
            <p className="text-sm text-muted-foreground">
              {withdrawn
                ? t('creatorDashboard.assignmentWithdrawnHint', {
                    date: assignment.cancelledAt ? formatDate(assignment.cancelledAt) : '',
                    defaultValue: 'Diese Anfrage wurde am {{date}} zurückgezogen. Es gibt nichts mehr zu tun – danke fürs Mitmachen.',
                  })
                : t('creatorDashboard.orderCancelledHint', {
                    defaultValue: 'Dieser Auftrag wurde storniert. Es gibt nichts mehr zu tun – danke fürs Mitmachen.',
                  })}
            </p>
          ) : pending ? (
            <>
              {/* Die laufende Frist; abgelaufen sagt es der Hinweis darunter. */}
              {assignment.responseDeadline && !eventPast && !overdue && <AnswerDeadline deadline={assignment.responseDeadline} />}
              <p className="text-sm">
                {eventPast
                  ? t('creatorDashboard.eventPastHint', {
                      defaultValue: 'Dieses Event liegt in der Vergangenheit. Eine Zu- oder Absage ist nicht mehr möglich.',
                    })
                  : overdue
                    ? t('creatorDashboard.deadlinePassedHint', {
                        defaultValue: 'Die Antwortfrist ist abgelaufen. Falls du doch dabei sein möchtest, melde dich bei uns.',
                      })
                    : assignment.phase === 'availability'
                      ? t('creatorDashboard.availabilityHint', {
                          date: assignment.eventDate ? formatDate(assignment.eventDate) : '',
                          defaultValue:
                            'Bist du am {{date}} verfügbar? Deine Zusage ist verbindlich zu dieser Vergütung. Gebucht bist du, sobald die Brand das Angebot bezahlt hat – dann bekommst du die Bestätigung.',
                        })
                      : t('creatorDashboard.respondHint', {
                          defaultValue: 'Sieh dir Event und Briefing an und gib uns Bescheid. Deine Antwort ist verbindlich.',
                        })}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="gradient"
                  className="gap-2 flex-1"
                  loading={respond.isPending}
                  disabled={!canAnswer}
                  onClick={() => setConfirm('accept')}
                >
                  <Check className="h-4 w-4" />
                  {assignment.phase === 'availability'
                    ? t('creatorDashboard.acceptAvailable', { defaultValue: 'Ich bin verfügbar' })
                    : t('creatorDashboard.accept', { defaultValue: 'Zusagen' })}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-1"
                  disabled={respond.isPending || !canAnswer}
                  onClick={() => setConfirm('decline')}
                >
                  <X className="h-4 w-4" />
                  {assignment.phase === 'availability'
                    ? t('creatorDashboard.declineUnavailable', { defaultValue: 'Nicht verfügbar' })
                    : t('creatorDashboard.decline', { defaultValue: 'Absagen' })}
                </Button>
              </div>
            </>
          ) : booked ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
                <p>
                  {t('creatorDashboard.bookedHint', {
                    defaultValue: 'Verbindlich gebucht – die Brand hat bezahlt. Das Briefing unten gilt, wir freuen uns auf dich!',
                  })}
                  {assignment.bookedAt ? ` (${formatDateTime(assignment.bookedAt)})` : ''}
                </p>
              </div>
              <PayoutHint assignment={assignment} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {assignment.response === 'accepted'
                ? t('creatorDashboard.alreadyAccepted', {
                    defaultValue: 'Du hast zugesagt. Sobald die Brand gebucht hat, bekommst du die Bestätigung mit allen Details.',
                  })
                : assignment.response === 'expired'
                  ? t('creatorDashboard.alreadyExpired', {
                      defaultValue: 'Die Anfrage ist ohne deine Antwort abgelaufen. Beim nächsten Mal gern schneller – oder melde dich bei uns.',
                    })
                  : t('creatorDashboard.alreadyDeclined', { defaultValue: 'Du hast abgesagt.' })}
              {assignment.respondedAt && assignment.response !== 'expired' ? ` (${formatDateTime(assignment.respondedAt)})` : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Event */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('brandDashboard.eventSection', { defaultValue: 'Event' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {/* Ohne Uhrzeit (Mitternacht in Wien) nur das Datum — „00:00" wäre eine Scheinangabe. */}
          <div>
            {assignment.eventDate ? formatDateTimeSmart(assignment.eventDate) : '—'}
            {assignment.eventEndDate ? ` – ${formatDateTimeSmart(assignment.eventEndDate)}` : ''}
          </div>
          {assignment.eventLocation && <div className="text-muted-foreground">{assignment.eventLocation}</div>}
          {assignment.publishDeadline && (
            <div>
              <span className="text-muted-foreground">
                {t('creatorDashboard.publishDeadline', { defaultValue: 'Veröffentlichung bis' })}:
              </span>{' '}
              {formatDate(assignment.publishDeadline)}
            </div>
          )}
          {assignment.eventId && (
            <Link href={localePath(`/event/${assignment.eventId}`)} className="inline-flex items-center gap-1 text-primary hover:underline">
              {t('brandDashboard.openEvent', { defaultValue: 'Event öffnen' })}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          {!assignment.eventId && assignment.phase === 'availability' && (
            <p className="text-xs text-muted-foreground">
              {t('creatorDashboard.eventFollows', {
                defaultValue: 'Die Eventseite entsteht, sobald die Brand gebucht hat.',
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Inhalte */}
      {assignment.deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5" />
              {t('brandDashboard.deliverablesSection', { defaultValue: 'Gewünschte Inhalte' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="list-disc pl-5 space-y-1">
              {assignment.deliverables.map((entry, index) => (
                <li key={`${entry.type}-${index}`}>
                  {entry.quantity}× {labels.deliverable(entry.type)}
                  {entry.platform ? ` (${labels.platform(entry.platform)})` : ''}
                  {entry.notes ? <span className="text-muted-foreground"> – {entry.notes}</span> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Briefing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('creatorDashboard.briefingTitle', { defaultValue: 'Briefing' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {assignment.briefingText ? (
            <p className="whitespace-pre-wrap">{assignment.briefingText}</p>
          ) : (
            <p className="text-muted-foreground">{t('creatorDashboard.briefingEmpty', { defaultValue: 'Noch kein Briefing-Text.' })}</p>
          )}
          {/* Die Unterlagen (PDF) gibt es hier nicht zum Herunterladen, sie
              kommen per E-Mail: bei 'sent' sind sie schon raus, sonst folgen
              sie noch. Ohne Unterlagen (hasBriefingFiles) kein Hinweis — sonst
              wartete der Creator auf eine Mail, die nie kommt. */}
          {assignment.hasBriefingFiles && (
            <p className="text-xs text-muted-foreground">
              {assignment.status === 'sent'
                ? t('creatorDashboard.briefingSent', {
                    defaultValue: 'Die ausführlichen Briefing-Unterlagen haben wir dir per E-Mail geschickt.',
                  })
                : t('creatorDashboard.briefingPending', {
                    defaultValue: 'Die ausführlichen Briefing-Unterlagen bekommst du per E-Mail, sobald sie fertig sind.',
                  })}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'accept'
                ? t('creatorDashboard.acceptConfirmTitle', { defaultValue: 'Verbindlich zusagen?' })
                : t('creatorDashboard.declineConfirmTitle', { defaultValue: 'Absagen?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'accept'
                ? assignment.phase === 'availability'
                  ? t('creatorDashboard.acceptAvailabilityConfirmDesc', {
                      amount: assignment.compensation !== null ? formatPrice(assignment.compensation) : '',
                      defaultValue:
                        'Du bestätigst, dass du für dieses Event zu {{amount}} verfügbar bist. Sobald die Brand bezahlt, bist du verbindlich gebucht. Eine Zusage lässt sich danach nur über uns zurücknehmen.',
                    })
                  : t('creatorDashboard.acceptConfirmDesc', {
                      defaultValue: 'Du sagst für dieses Event zu. Eine Zusage lässt sich danach nur über uns zurücknehmen.',
                    })
                : t('creatorDashboard.declineConfirmDesc', {
                    defaultValue: 'Du sagst für dieses Event ab. Die Anfrage lässt sich danach nicht mehr annehmen.',
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) respond.mutate(confirm)
              }}
            >
              {confirm === 'accept'
                ? t('creatorDashboard.accept', { defaultValue: 'Zusagen' })
                : t('creatorDashboard.decline', { defaultValue: 'Absagen' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** „Antwort bis … (noch 1 Tag 3 Std)" — laufend aktualisiert. */
function AnswerDeadline({ deadline }: { deadline: string }) {
  const { t } = useTranslation()
  const remaining = useCountdown(deadline)
  if (!remaining) return null

  const units: RemainingUnits = {
    day: t('brandDashboard.unitDay', { defaultValue: 'Tag' }),
    days: t('brandDashboard.unitDays', { defaultValue: 'Tage' }),
    hour: t('brandDashboard.unitHour', { defaultValue: 'Std' }),
    hours: t('brandDashboard.unitHours', { defaultValue: 'Std' }),
    minute: t('brandDashboard.unitMinute', { defaultValue: 'Min' }),
    minutes: t('brandDashboard.unitMinutes', { defaultValue: 'Min' }),
  }
  const urgent = !remaining.expired && remaining.totalMs < 12 * 60 * 60 * 1000

  return (
    <div className={`flex items-center gap-2 text-sm ${urgent ? 'text-orange-700' : 'text-muted-foreground'}`}>
      <Clock className="h-4 w-4 shrink-0" />
      {remaining.expired
        ? t('creatorDashboard.deadlinePassed', { defaultValue: 'Antwortfrist abgelaufen' })
        : t('creatorDashboard.answerByRemaining', {
            date: formatDateTime(deadline),
            remaining: formatRemaining(remaining, units),
            defaultValue: 'Antwort bis {{date}} (noch {{remaining}})',
          })}
    </div>
  )
}

/** Nach der Buchung: Wie es mit der Vergütung weitergeht. */
function PayoutHint({ assignment }: { assignment: CreatorAssignment }) {
  const { t } = useTranslation()
  const localePath = useLocalePath()

  if (isPaidOut(assignment)) {
    // Ohne Datum (Altfall, von Hand vermerkt) die Variante ohne „am …".
    const paidAt = assignment.payout?.paidAt ? formatDate(assignment.payout.paidAt) : ''
    const manual = assignment.payout?.status === 'manual'
    const text = manual
      ? paidAt
        ? t('creatorDashboard.payoutManualHint', { date: paidAt, defaultValue: 'Deine Vergütung wurde am {{date}} überwiesen.' })
        : t('creatorDashboard.payoutManualHintNoDate', { defaultValue: 'Deine Vergütung wurde überwiesen.' })
      : paidAt
        ? t('creatorDashboard.payoutPaidHint', {
            date: paidAt,
            defaultValue: 'Deine Vergütung wurde am {{date}} auf dein Stripe-Konto ausgezahlt.',
          })
        : t('creatorDashboard.payoutPaidHintNoDate', { defaultValue: 'Deine Vergütung wurde auf dein Stripe-Konto ausgezahlt.' })
    return (
      <div className="flex items-start gap-2 text-green-800">
        <Wallet className="h-5 w-5 shrink-0 mt-0.5" />
        <p>{text}</p>
      </div>
    )
  }

  // Die Auszahlung ist bei Stripe gescheitert (meist: Auszahlungskonto
  // fehlt oder ist unvollständig). Wir kümmern uns, aber das Konto soll der
  // Creator selbst prüfen.
  if (assignment.payout?.status === 'failed') {
    return (
      <div className="flex items-start gap-2 text-destructive">
        <Wallet className="h-5 w-5 shrink-0 mt-0.5" />
        <p>
          {t('creatorDashboard.payoutFailedHint', {
            defaultValue:
              'Die Auszahlung ist fehlgeschlagen – wir kümmern uns darum. Prüfe bitte dein Auszahlungskonto in den Einstellungen.',
          })}{' '}
          <Link href={localePath('/settings#payout')} className="underline hover:no-underline">
            {t('creatorDashboard.payoutSettingsLink', { defaultValue: 'Auszahlungskonto prüfen' })}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 text-muted-foreground">
      <Wallet className="h-5 w-5 shrink-0 mt-0.5" />
      <p>
        {t('creatorDashboard.payoutOpenHint', {
          defaultValue: 'Nach dem Event zahlen wir deine Vergütung auf dein Stripe-Auszahlungskonto aus.',
        })}{' '}
        <Link href={localePath('/settings#payout')} className="text-primary hover:underline">
          {t('creatorDashboard.payoutSettingsLink', { defaultValue: 'Auszahlungskonto prüfen' })}
        </Link>
      </p>
    </div>
  )
}
