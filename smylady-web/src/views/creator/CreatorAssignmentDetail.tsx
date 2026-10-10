'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Check, Clapperboard, ExternalLink, FileText, X } from 'lucide-react'
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
import { creatorAreaService, readCreatorError, type CreatorAssignment } from '@/services/creator'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { LoadingBars } from '@/components/brand/brandShared'
import { CreatorGate, ResponseBadge, useCreatorLabels } from '@/components/creator/creatorShared'
import { CREATOR_ASSIGNMENTS_QUERY_KEY } from './CreatorDashboard'

/**
 * Eine Anfrage aus Sicht des Creators: Event, Vergütung, Briefing, gewünschte
 * Inhalte — und die Antwort. Zu- oder Absage sind endgültig; wer sich geirrt
 * hat, meldet sich bei uns (das Backend weist eine zweite Antwort mit 409 ab).
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
          ? t('creatorDashboard.acceptedDesc', { defaultValue: 'Danke! Wir melden uns mit den Details zum Event.' })
          : t('creatorDashboard.declinedDesc', { defaultValue: 'Schade, vielleicht beim nächsten Mal.' }),
      })
    },
    onError: (error: unknown) =>
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readCreatorError(error, t('creatorDashboard.respondFailed', { defaultValue: 'Die Antwort konnte nicht gespeichert werden.' })),
      }),
  })

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
          <ResponseBadge value={assignment.response} />
        </div>
      </div>

      {/* Antwort */}
      <Card className={assignment.response === 'pending' ? 'border-yellow-200 bg-yellow-50/40' : undefined}>
        <CardContent className="p-6 space-y-4">
          {assignment.compensation !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatPrice(assignment.compensation)}</span>
              <span className="text-sm text-muted-foreground">
                {t('creatorDashboard.compensation', { defaultValue: 'Vergütung' })}
              </span>
            </div>
          )}
          {assignment.response === 'pending' ? (
            <>
              <p className="text-sm">
                {t('creatorDashboard.respondHint', {
                  defaultValue: 'Sieh dir Event und Briefing an und gib uns Bescheid. Deine Antwort ist verbindlich.',
                })}
              </p>
              <div className="flex gap-3">
                <Button variant="gradient" className="gap-2 flex-1" loading={respond.isPending} onClick={() => setConfirm('accept')}>
                  <Check className="h-4 w-4" />
                  {t('creatorDashboard.accept', { defaultValue: 'Zusagen' })}
                </Button>
                <Button variant="outline" className="gap-2 flex-1" disabled={respond.isPending} onClick={() => setConfirm('decline')}>
                  <X className="h-4 w-4" />
                  {t('creatorDashboard.decline', { defaultValue: 'Absagen' })}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {assignment.response === 'accepted'
                ? t('creatorDashboard.alreadyAccepted', { defaultValue: 'Du hast zugesagt. Wir melden uns mit allen Details.' })
                : t('creatorDashboard.alreadyDeclined', { defaultValue: 'Du hast abgesagt.' })}
              {assignment.respondedAt ? ` (${formatDateTime(assignment.respondedAt)})` : ''}
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
          <div>{assignment.eventDate ? formatDateTime(assignment.eventDate) : '—'}</div>
          {assignment.eventLocation && <div className="text-muted-foreground">{assignment.eventLocation}</div>}
          {assignment.eventId && (
            <Link href={localePath(`/event/${assignment.eventId}`)} className="inline-flex items-center gap-1 text-primary hover:underline">
              {t('brandDashboard.openEvent', { defaultValue: 'Event öffnen' })}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
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
                  {entry.platform ? ` (${entry.platform})` : ''}
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
          {assignment.status !== 'sent' && (
            <p className="text-xs text-muted-foreground">
              {t('creatorDashboard.briefingPending', {
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
                ? t('creatorDashboard.acceptConfirmDesc', {
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
