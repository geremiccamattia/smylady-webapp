'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, Lock, Sparkles, XCircle } from 'lucide-react'
import { isEventOver } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useCreatorProfile, type CreatorProfileStanding } from '@/hooks/useCreatorProfile'
import { LoadingBars, StatusPanel } from '@/components/brand/brandShared'
import { CATEGORY_OPTIONS, FOLLOWER_OPTIONS, OTHER_PLATFORMS } from '@/components/creator/CreatorApplicationForm'
import { isPaidOut, type AssignmentPhase, type AssignmentResponse, type CreatorAssignment, type CreatorProfileStatus } from '@/services/creator'
import { formatDate } from '@/lib/utils'

/** Gemeinsame Bausteine der Creator-Seiten: Zugangsprüfung, Badges, Beschriftungen. */

/**
 * Schlüssel zu einem gespeicherten Enum-Wert, aus denselben Listen wie das
 * Bewerbungsformular. Die Werte selbst sind deutsch ("Unter 1.500", "Musik")
 * und stehen so in der Datenbank; übersetzt wird nur die Anzeige.
 */
const labelKeyOf = (options: { value: string; labelKey: string }[], value: string): string | undefined =>
  options.find((option) => option.value === value)?.labelKey

export function useCreatorLabels() {
  const { t } = useTranslation()

  const followerRange = (value: string): string => {
    const key = labelKeyOf(FOLLOWER_OPTIONS, value)
    return key ? t(key, { defaultValue: value }) : value
  }

  const category = (value: string): string => {
    const key = labelKeyOf(CATEGORY_OPTIONS, value)
    return key ? t(key, { defaultValue: value }) : value
  }

  // Markennamen (Instagram, TikTok, …) bleiben, wie sie sind. Übersetzt wird
  // nur der Sammelposten: Das Profil speichert "Sonstige", die Bewerbung
  // "Sonstiges" — beides landet auf demselben Schlüssel.
  const platform = (value: string): string => {
    if (value === 'Sonstige' || value === 'Sonstiges') {
      return t('influencer.platformOther', { defaultValue: 'Sonstiges' })
    }
    const key = labelKeyOf(OTHER_PLATFORMS, value)
    return key ? t(key, { defaultValue: value }) : value
  }

  const profileStatus = (status: CreatorProfileStatus): string =>
    ({
      pending: t('creatorDashboard.profilePending', { defaultValue: 'In Prüfung' }),
      active: t('creatorDashboard.profileActive', { defaultValue: 'Aktiv' }),
      paused: t('creatorDashboard.profilePaused', { defaultValue: 'Pausiert' }),
      rejected: t('creatorDashboard.profileRejected', { defaultValue: 'Abgelehnt' }),
      suspended: t('creatorDashboard.profileSuspended', { defaultValue: 'Gesperrt' }),
    })[status] ?? status

  const response = (value: AssignmentResponse): string =>
    ({
      pending: t('creatorDashboard.responsePending', { defaultValue: 'Offen' }),
      accepted: t('creatorDashboard.responseAccepted', { defaultValue: 'Zugesagt' }),
      declined: t('creatorDashboard.responseDeclined', { defaultValue: 'Abgesagt' }),
      expired: t('creatorDashboard.responseExpired', { defaultValue: 'Abgelaufen' }),
    })[value] ?? value

  const phase = (value: AssignmentPhase): string =>
    ({
      availability: t('creatorDashboard.phaseAvailability', { defaultValue: 'Verfügbarkeitsanfrage' }),
      booked: t('creatorDashboard.phaseBooked', { defaultValue: 'Gebucht' }),
    })[value] ?? value

  const deliverable = (type: string): string =>
    ({
      reel: t('brandDashboard.deliverableReel', { defaultValue: 'Reel' }),
      tiktok: t('brandDashboard.deliverableTiktok', { defaultValue: 'TikTok-Video' }),
      feed_post: t('brandDashboard.deliverableFeedPost', { defaultValue: 'Feed-Post' }),
      story: t('brandDashboard.deliverableStory', { defaultValue: 'Story' }),
      youtube_video: t('brandDashboard.deliverableYoutube', { defaultValue: 'YouTube-Video' }),
      photo: t('brandDashboard.deliverablePhoto', { defaultValue: 'Foto' }),
      other: t('brandDashboard.deliverableOther', { defaultValue: 'Sonstiges' }),
    })[type] ?? type

  return { profileStatus, response, phase, deliverable, followerRange, category, platform }
}

export function ResponseBadge({ value }: { value: AssignmentResponse }) {
  const { response } = useCreatorLabels()
  switch (value) {
    case 'accepted':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{response(value)}</Badge>
    case 'declined':
      return <Badge variant="destructive">{response(value)}</Badge>
    case 'expired':
      return <Badge variant="secondary">{response(value)}</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{response(value)}</Badge>
  }
}

/**
 * In welcher Phase die Anfrage ist: Verfügbarkeit (noch nicht gebucht) oder
 * gebucht (die Brand hat bezahlt). Eine zurückgezogene Anfrage und ein
 * stornierter Brand-Auftrag schlagen beides.
 *
 * „Gebucht" gilt nur für eine ZUSAGE: Wer abgesagt hat oder dessen Frist
 * verstrichen ist, ist in der Buchungsphase nicht gebucht — da sagt der
 * Antwort-Badge daneben schon alles, ein Phasen-Badge käme nur dazwischen.
 */
export function PhaseBadge({
  assignment,
}: {
  assignment: Pick<CreatorAssignment, 'phase' | 'orderStatus' | 'response' | 'cancelledAt'>
}) {
  const { t } = useTranslation()
  const { phase } = useCreatorLabels()
  if (assignment.cancelledAt) {
    return <Badge variant="destructive">{t('creatorDashboard.assignmentWithdrawn', { defaultValue: 'Zurückgezogen' })}</Badge>
  }
  if (assignment.orderStatus === 'cancelled') {
    return <Badge variant="destructive">{t('creatorDashboard.orderCancelled', { defaultValue: 'Storniert' })}</Badge>
  }
  if (assignment.orderStatus === 'completed') {
    return <Badge variant="secondary">{t('creatorDashboard.orderCompleted', { defaultValue: 'Abgeschlossen' })}</Badge>
  }
  if (assignment.phase === 'booked') {
    if (assignment.response !== 'accepted') return null
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {phase('booked')}
      </Badge>
    )
  }
  return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{phase('availability')}</Badge>
}

/**
 * Der Auszahlungsstand einer zugesagten, gebuchten Anfrage. „Offen" ist die
 * Auszahlung erst, wenn das Event vorbei ist (oder der Auftrag abgeschlossen);
 * davor steht sie schlicht noch bevor.
 */
export function PayoutBadge({
  assignment,
}: {
  assignment: Pick<CreatorAssignment, 'payout' | 'phase' | 'response' | 'eventDate' | 'eventEndDate' | 'orderStatus' | 'cancelledAt'>
}) {
  const { t } = useTranslation()
  if (assignment.phase !== 'booked' || assignment.response !== 'accepted') return null
  if (assignment.cancelledAt || assignment.orderStatus === 'cancelled') return null
  if (isPaidOut(assignment)) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        {assignment.payout?.paidAt
          ? t('creatorDashboard.payoutPaidAt', { date: formatDate(assignment.payout.paidAt), defaultValue: 'Ausgezahlt am {{date}}' })
          : t('creatorDashboard.payoutPaid', { defaultValue: 'Ausgezahlt' })}
      </Badge>
    )
  }
  if (assignment.payout?.status === 'failed') {
    return <Badge variant="destructive">{t('creatorDashboard.payoutFailed', { defaultValue: 'Auszahlung fehlgeschlagen' })}</Badge>
  }
  const eventDone =
    assignment.orderStatus === 'completed' || isEventOver(assignment.eventEndDate || null, assignment.eventDate || null)
  return eventDone ? (
    <Badge variant="outline">{t('creatorDashboard.payoutOpen', { defaultValue: 'Auszahlung offen' })}</Badge>
  ) : (
    <Badge variant="outline">{t('creatorDashboard.payoutAfterEvent', { defaultValue: 'Auszahlung nach dem Event' })}</Badge>
  )
}

/** Das Event der Anfrage liegt hinter uns; eine Antwort ändert nichts mehr. */
export function PastEventBadge() {
  const { t } = useTranslation()
  return <Badge variant="secondary">{t('creatorDashboard.eventPast', { defaultValue: 'Vergangen' })}</Badge>
}

export function CreatorStatusBadge({ status }: { status: CreatorProfileStatus }) {
  const { profileStatus } = useCreatorLabels()
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{profileStatus(status)}</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{profileStatus(status)}</Badge>
    default:
      return <Badge variant="destructive">{profileStatus(status)}</Badge>
  }
}

/**
 * Zeigt die Kinder nur für ein aktives Creator-Profil (oder die in `allow`
 * genannten Zustände). Ohne Profil geht es zur Bewerbung; die kennt alle
 * Zwischenstände (eingereicht, angenommen, abgelehnt).
 *
 * Ein Gast geht auf /login mit Rücksprung (?next=), siehe BrandGate: Ohne
 * Nutzer setzt useCreatorProfile keinen Request ab, also auch keinen 401 —
 * vorher sah ein Gast "Noch kein Creator-Profil" statt der Anmeldung.
 */
export function CreatorGate({
  children,
  allow = ['active'],
}: {
  children: React.ReactNode
  allow?: CreatorProfileStanding[]
}) {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { profile, standing, isError, refetch } = useCreatorProfile()
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const guest = !authLoading && !user
  const loginBase = localePath('/login')
  useEffect(() => {
    if (!guest) return
    // Die Query gehört zum Rücksprung (siehe BrandGate).
    const search = typeof window !== 'undefined' ? window.location.search : ''
    router.replace(`${loginBase}?next=${encodeURIComponent(pathname + search)}`)
  }, [guest, loginBase, pathname, router])

  if (guest) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingBars />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <StatusPanel
            icon={<XCircle className="h-8 w-8 text-white" />}
            title={t('common.error', { defaultValue: 'Fehler' })}
            description={t('creatorDashboard.loadFailed', {
              defaultValue: 'Dein Creator-Profil lässt sich gerade nicht laden. Bitte versuche es später erneut.',
            })}
            action={
              <Button variant="outline" onClick={() => refetch()}>
                {t('common.retry', { defaultValue: 'Erneut versuchen' })}
              </Button>
            }
          />
        </CardContent>
      </Card>
    )
  }

  if (!standing) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingBars />
        </CardContent>
      </Card>
    )
  }

  if (allow.includes(standing)) return <>{children}</>

  if (standing === 'none') {
    return (
      <Card>
        <CardContent className="p-6">
          <StatusPanel
            icon={<Sparkles className="h-8 w-8 text-white" />}
            title={t('creatorDashboard.noProfileTitle', { defaultValue: 'Noch kein Creator-Profil' })}
            description={t('creatorDashboard.noProfileDesc', {
              defaultValue: 'Dieser Bereich ist für Mitglieder des Creator Clubs. Bewirb dich, um Anfragen von Brands zu erhalten.',
            })}
            action={
              <Link href={localePath('/creator/apply')}>
                <Button variant="gradient">{t('creatorDashboard.noProfileButton', { defaultValue: 'Zur Bewerbung' })}</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    )
  }

  if (standing === 'pending') {
    return (
      <Card>
        <CardContent className="p-6">
          <StatusPanel
            icon={<Clock className="h-8 w-8 text-white" />}
            title={t('creatorDashboard.pendingTitle', { defaultValue: 'Dein Profil wird noch eingerichtet.' })}
            description={t('creatorDashboard.pendingDesc', {
              defaultValue: 'Sobald es aktiv ist, siehst du hier Anfragen von Brands.',
            })}
            action={
              // Wer sich vertippt hat, soll das vor der Aktivierung korrigieren können.
              <Link href={localePath('/creator/profile')}>
                <Button variant="outline">{t('creatorDashboard.editProfile', { defaultValue: 'Profil bearbeiten' })}</Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    )
  }

  // Pausiert, gesperrt oder abgelehnt — je Status ein eigener Satz, denn
  // „nicht aktiv" sagt nicht, ob und wie es weitergeht.
  const blockedDescription =
    profile?.status === 'paused'
      ? t('creatorDashboard.blockedPausedDesc', {
          defaultValue: 'Dein Profil ist pausiert – melde dich bei uns, wenn du wieder Aufträge möchtest.',
        })
      : profile?.status === 'suspended'
        ? t('creatorDashboard.blockedSuspendedDesc', {
            defaultValue: 'Dein Profil ist gesperrt. Bei Fragen melde dich bei office@shareyourparty.de.',
          })
        : profile?.status === 'rejected'
          ? t('creatorDashboard.blockedRejectedDesc', {
              defaultValue: 'Dein Profil wurde abgelehnt. Bei Fragen melde dich bei office@shareyourparty.de.',
            })
          : t('creatorDashboard.blockedDesc', {
              defaultValue: 'Anfragen sind im Moment nicht möglich. Bei Fragen melde dich bei office@shareyourparty.de.',
            })

  return (
    <Card>
      <CardContent className="p-6">
        <StatusPanel
          icon={<Lock className="h-8 w-8 text-white" />}
          title={t('creatorDashboard.blockedTitle', { defaultValue: 'Dein Creator-Profil ist derzeit nicht aktiv.' })}
          description={blockedDescription}
          action={
            <Link href={localePath('/explore')}>
              <Button variant="outline">{t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}</Button>
            </Link>
          }
        />
      </CardContent>
    </Card>
  )
}
