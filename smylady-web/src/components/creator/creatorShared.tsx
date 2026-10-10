'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Clock, Lock, Sparkles, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useCreatorProfile, type CreatorProfileStanding } from '@/hooks/useCreatorProfile'
import { LoadingBars, StatusPanel } from '@/components/brand/brandShared'
import { CATEGORY_OPTIONS, FOLLOWER_OPTIONS, OTHER_PLATFORMS } from '@/components/creator/CreatorApplicationForm'
import type { AssignmentResponse, CreatorProfileStatus } from '@/services/creator'

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

  return { profileStatus, response, deliverable, followerRange, category, platform }
}

export function ResponseBadge({ value }: { value: AssignmentResponse }) {
  const { response } = useCreatorLabels()
  switch (value) {
    case 'accepted':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{response(value)}</Badge>
    case 'declined':
      return <Badge variant="destructive">{response(value)}</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{response(value)}</Badge>
  }
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
  const { standing, isError, refetch } = useCreatorProfile()
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const guest = !authLoading && !user
  const loginTarget = localePath(`/login?next=${encodeURIComponent(pathname)}`)
  useEffect(() => {
    if (guest) router.replace(loginTarget)
  }, [guest, loginTarget, router])

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
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <StatusPanel
          icon={<Lock className="h-8 w-8 text-white" />}
          title={t('creatorDashboard.blockedTitle', { defaultValue: 'Dein Creator-Profil ist derzeit nicht aktiv.' })}
          description={t('creatorDashboard.blockedDesc', {
            defaultValue: 'Anfragen sind im Moment nicht möglich. Bei Fragen melde dich bei office@shareyourparty.de.',
          })}
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
