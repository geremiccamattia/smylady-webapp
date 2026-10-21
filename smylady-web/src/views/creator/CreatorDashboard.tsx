'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, Clock, CreditCard, Eye, EyeOff, Inbox, Pencil, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { CREATOR_PROFILE_QUERY_KEY, useCreatorProfile } from '@/hooks/useCreatorProfile'
import { useGetConnectedAccount } from '@/hooks/useStripe'
import { creatorAreaService, isPaidOut, isResponseOverdue, readCreatorError, type CreatorAssignment } from '@/services/creator'
import { formatDate, formatDateTime, formatPrice, isEventOver } from '@/lib/utils'
import { LoadingBars } from '@/components/brand/brandShared'
import { CreatorEarningsCard } from '@/components/creator/CreatorEarningsCard'
import {
  CreatorGate,
  CreatorStatusBadge,
  PastEventBadge,
  PayoutBadge,
  PhaseBadge,
  ResponseBadge,
  useCreatorLabels,
} from '@/components/creator/creatorShared'

export const CREATOR_ASSIGNMENTS_QUERY_KEY = ['creator', 'assignments'] as const

/**
 * Startseite des Creator-Bereichs: Profil mit Freigabe für Brands und alle
 * Anfragen.
 *
 * Die Freigabe (brandVisibilityConsent) ist der wichtigste Schalter hier:
 * Ohne sie sieht eine Brand das Profil nicht, auch wenn wir den Creator
 * vorschlagen — bisher ging das nur per API.
 */
export default function CreatorDashboard() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <CreatorGate>
        <DashboardContent />
      </CreatorGate>
    </div>
  )
}

function DashboardContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const labels = useCreatorLabels()
  const { user } = useAuth()
  const { profile, standing } = useCreatorProfile()

  const assignmentsQuery = useQuery<CreatorAssignment[]>({
    queryKey: CREATOR_ASSIGNMENTS_QUERY_KEY,
    queryFn: () => creatorAreaService.getMyAssignments(),
    enabled: Boolean(user) && standing === 'active',
    retry: false,
  })

  const consent = useMutation({
    mutationFn: (value: boolean) => creatorAreaService.updateMyProfile({ brandVisibilityConsent: value }),
    onSuccess: (updated) => {
      queryClient.setQueryData(CREATOR_PROFILE_QUERY_KEY, updated)
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: updated.brandVisibilityConsent
          ? t('creatorDashboard.consentOn', { defaultValue: 'Brands können dein Profil jetzt sehen.' })
          : t('creatorDashboard.consentOff', { defaultValue: 'Dein Profil ist für Brands verborgen.' }),
      })
    },
    onError: (error: unknown) =>
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readCreatorError(error, t('creatorDashboard.consentFailed', { defaultValue: 'Die Freigabe konnte nicht geändert werden.' })),
      }),
  })

  const assignments = assignmentsQuery.data ?? []
  // Offen heisst: noch unbeantwortet, Frist läuft noch UND das Event liegt
  // noch vor uns. Eine Anfrage zu einem vergangenen Event wartet auf nichts.
  const open = assignments.filter(
    (entry) =>
      entry.response === 'pending' &&
      entry.orderStatus !== 'cancelled' &&
      !isResponseOverdue(entry) &&
      !isEventOver(null, entry.eventDate),
  )
  // Gebucht und noch nicht ausgezahlt: Dann braucht der Creator ein
  // Auszahlungskonto, sonst können wir die Vergütung nicht überweisen.
  const awaitingPayout = assignments.some(
    (entry) => entry.phase === 'booked' && entry.response === 'accepted' && entry.orderStatus !== 'cancelled' && !isPaidOut(entry),
  )
  const connectedAccount = useGetConnectedAccount(standing === 'active' && awaitingPayout)
  const payoutAccountMissing = awaitingPayout && connectedAccount.isSuccess && connectedAccount.data?.accountStatus !== 'active'

  if (!profile) return null

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">{t('creatorDashboard.title', { defaultValue: 'Creator-Bereich' })}</h1>
        <p className="text-muted-foreground">
          {t('creatorDashboard.subtitle', { defaultValue: 'Deine Anfragen von Brands, deine Einnahmen und dein Profil.' })}
        </p>
      </div>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('creatorDashboard.profileTitle', { defaultValue: 'Dein Creator-Profil' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CreatorStatusBadge status={profile.status} />
                {profile.city && <span className="text-sm text-muted-foreground">{profile.city}</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.channels.map((channel, index) => (
                  <Badge key={`${channel.platform}-${index}`} variant="secondary" className="font-normal">
                    {labels.platform(channel.platform)}: @{channel.username}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.categories.map((category) => (
                  <Badge key={category} variant="outline" className="font-normal">
                    {labels.category(category)}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href={localePath('/creator/profile')}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                {t('creatorDashboard.editProfile', { defaultValue: 'Profil bearbeiten' })}
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div className="flex items-start gap-3">
              {profile.brandVisibilityConsent ? (
                <Eye className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-medium text-sm">
                  {t('creatorDashboard.consentTitle', { defaultValue: 'Profil für Brands sichtbar' })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('creatorDashboard.consentDesc', {
                    defaultValue:
                      'Brands sehen Name, Kanäle, Kategorien, Stadt und Bio, wenn wir dich für einen Auftrag vorschlagen. Ohne Freigabe sehen sie nur einen Hinweis.',
                  })}
                </p>
              </div>
            </div>
            <Switch
              checked={profile.brandVisibilityConsent}
              disabled={consent.isPending}
              onCheckedChange={(value) => consent.mutate(value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hinweis auf offene Anfragen */}
      {open.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 text-sm">
            {t('creatorDashboard.openHint', {
              count: open.length,
              defaultValue_one: 'Eine Anfrage wartet auf deine Antwort.',
              defaultValue_other: '{{count}} Anfragen warten auf deine Antwort.',
              defaultValue: '{{count}} Anfragen warten auf deine Antwort.',
            })}
          </CardContent>
        </Card>
      )}

      {/* Ohne Auszahlungskonto bleibt die Vergütung liegen: Hinweis, sobald
          eine Buchung offen ist und Stripe (noch) nicht verbunden ist. */}
      {payoutAccountMissing && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 text-sm flex items-center gap-3 flex-wrap">
            <CreditCard className="h-5 w-5 text-orange-700 shrink-0" />
            <div className="flex-1 min-w-[12rem]">
              <div className="font-medium">
                {t('creatorDashboard.payoutNudgeTitle', { defaultValue: 'Auszahlungskonto einrichten' })}
              </div>
              <p className="text-muted-foreground">
                {t('creatorDashboard.payoutNudgeDesc', {
                  defaultValue:
                    'Du bist gebucht. Verbinde dein Stripe-Konto in den Einstellungen, damit wir deine Vergütung nach dem Event auszahlen können.',
                })}
              </p>
            </div>
            <Link href={localePath('/settings#payout')}>
              <Button variant="outline" size="sm">
                {t('creatorDashboard.payoutNudgeButton', { defaultValue: 'Zu den Einstellungen' })}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Einnahmen — erst, wenn die Aufträge geladen sind; Laden und Fehler zeigt die Liste darunter. */}
      {assignmentsQuery.isSuccess && <CreatorEarningsCard assignments={assignments} />}

      {/* Anfragen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('creatorDashboard.assignmentsTitle', { defaultValue: 'Anfragen' })}
            {assignments.length > 0 && <span className="text-muted-foreground font-normal">({assignments.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsQuery.isLoading ? (
            <LoadingBars />
          ) : assignmentsQuery.isError ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {t('creatorDashboard.assignmentsLoadFailed', { defaultValue: 'Deine Anfragen lassen sich gerade nicht laden.' })}
              </p>
              <Button variant="outline" onClick={() => assignmentsQuery.refetch()}>
                {t('common.retry', { defaultValue: 'Erneut versuchen' })}
              </Button>
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('creatorDashboard.assignmentsEmpty', {
                defaultValue: 'Noch keine Anfragen. Sobald wir dich für ein Event anfragen, erscheint die Anfrage hier.',
              })}
            </p>
          ) : (
            <ul className="divide-y">
              {assignments.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={localePath(`/creator/assignments/${entry.id}`)}
                    className="flex items-center gap-4 py-4 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {entry.eventName || t('creatorDashboard.assignmentUnnamed', { defaultValue: 'Auftrag' })}
                        </span>
                        <PhaseBadge assignment={entry} />
                        <ResponseBadge value={entry.response} />
                        <PayoutBadge assignment={entry} />
                        {isEventOver(null, entry.eventDate) && <PastEventBadge />}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {entry.eventDate ? formatDate(entry.eventDate) : '—'}
                          {entry.eventLocation ? ` · ${entry.eventLocation}` : ''}
                        </span>
                      </div>
                      {/* Offene Verfügbarkeitsanfrage: bis wann die Antwort erwartet wird. */}
                      {entry.response === 'pending' && entry.responseDeadline && !isResponseOverdue(entry) && (
                        <div className="text-xs text-orange-700 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {t('creatorDashboard.answerBy', {
                            date: formatDateTime(entry.responseDeadline),
                            defaultValue: 'Antwort bis {{date}}',
                          })}
                        </div>
                      )}
                      {entry.publishDeadline && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t('creatorDashboard.publishDeadline', { defaultValue: 'Veröffentlichung bis' })}: {formatDate(entry.publishDeadline)}
                        </div>
                      )}
                    </div>
                    {entry.compensation !== null && (
                      <div className="text-right text-sm shrink-0">
                        {/* Abgelehnt: Betrag bleibt sichtbar, zählt aber nicht zu den Einnahmen. */}
                        <div
                          className={
                            entry.response === 'declined' ? 'font-medium line-through text-muted-foreground' : 'font-medium'
                          }
                        >
                          {formatPrice(entry.compensation)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('creatorDashboard.compensation', { defaultValue: 'Vergütung' })}
                        </div>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
