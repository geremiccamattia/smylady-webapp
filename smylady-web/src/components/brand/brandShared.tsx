'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Building2, Clock, Lock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useBrandProfile, type BrandStanding } from '@/hooks/useBrandProfile'
import type { BrandOrderStatus, BrandProfileStatus, DeliverableType } from '@/services/brand'

/**
 * Gemeinsame Bausteine der Brand-Seiten: Zugangsprüfung, Status-Badges und
 * die Beschriftung der Auftragsinhalte.
 */

// ───────────────────────────────────────────────────────────────
// Beschriftungen
// ───────────────────────────────────────────────────────────────

export function useBrandLabels() {
  const { t } = useTranslation()

  const orderStatus = (status: BrandOrderStatus): string =>
    ({
      draft: t('brandDashboard.statusDraft', { defaultValue: 'Entwurf' }),
      submitted: t('brandDashboard.statusSubmitted', { defaultValue: 'Eingereicht' }),
      in_review: t('brandDashboard.statusInReview', { defaultValue: 'In Prüfung' }),
      offer_sent: t('brandDashboard.statusOfferSent', { defaultValue: 'Angebot erhalten' }),
      confirmed: t('brandDashboard.statusConfirmed', { defaultValue: 'Bestätigt' }),
      completed: t('brandDashboard.statusCompleted', { defaultValue: 'Abgeschlossen' }),
      cancelled: t('brandDashboard.statusCancelled', { defaultValue: 'Storniert' }),
    })[status] ?? status

  const profileStatus = (status: BrandProfileStatus): string =>
    ({
      pending: t('brandDashboard.profilePending', { defaultValue: 'In Prüfung' }),
      active: t('brandDashboard.profileActive', { defaultValue: 'Freigeschaltet' }),
      paused: t('brandDashboard.profilePaused', { defaultValue: 'Pausiert' }),
      rejected: t('brandDashboard.profileRejected', { defaultValue: 'Abgelehnt' }),
      suspended: t('brandDashboard.profileSuspended', { defaultValue: 'Gesperrt' }),
    })[status] ?? status

  const deliverable = (type: DeliverableType): string =>
    ({
      reel: t('brandDashboard.deliverableReel', { defaultValue: 'Reel' }),
      tiktok: t('brandDashboard.deliverableTiktok', { defaultValue: 'TikTok-Video' }),
      feed_post: t('brandDashboard.deliverableFeedPost', { defaultValue: 'Feed-Post' }),
      story: t('brandDashboard.deliverableStory', { defaultValue: 'Story' }),
      youtube_video: t('brandDashboard.deliverableYoutube', { defaultValue: 'YouTube-Video' }),
      photo: t('brandDashboard.deliverablePhoto', { defaultValue: 'Foto' }),
      other: t('brandDashboard.deliverableOther', { defaultValue: 'Sonstiges' }),
    })[type] ?? type

  const gender = (value: string): string =>
    ({
      all: t('brandDashboard.genderAll', { defaultValue: 'Alle' }),
      female: t('brandDashboard.genderFemale', { defaultValue: 'Weiblich' }),
      male: t('brandDashboard.genderMale', { defaultValue: 'Männlich' }),
      diverse: t('brandDashboard.genderDiverse', { defaultValue: 'Divers' }),
    })[value] ?? value

  return { orderStatus, profileStatus, deliverable, gender }
}

// ───────────────────────────────────────────────────────────────
// Badges
// ───────────────────────────────────────────────────────────────

export function OrderStatusBadge({ status }: { status: BrandOrderStatus }) {
  const { orderStatus } = useBrandLabels()
  const label = orderStatus(status)
  switch (status) {
    case 'draft':
      return <Badge variant="outline">{label}</Badge>
    case 'submitted':
    case 'in_review':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{label}</Badge>
    case 'offer_sent':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{label}</Badge>
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{label}</Badge>
    case 'completed':
      return <Badge variant="secondary">{label}</Badge>
    case 'cancelled':
      return <Badge variant="destructive">{label}</Badge>
    default:
      return <Badge variant="outline">{label}</Badge>
  }
}

export function ProfileStatusBadge({ status }: { status: BrandProfileStatus }) {
  const { profileStatus } = useBrandLabels()
  const label = profileStatus(status)
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{label}</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{label}</Badge>
    default:
      return <Badge variant="destructive">{label}</Badge>
  }
}

// ───────────────────────────────────────────────────────────────
// Statusanzeige
// ───────────────────────────────────────────────────────────────

export function StatusPanel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]">
        {icon}
      </div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  )
}

export function LoadingBars() {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-muted animate-pulse rounded-md" />
      <div className="h-10 bg-muted animate-pulse rounded-md" />
      <div className="h-10 bg-muted animate-pulse rounded-md" />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// Zugangsprüfung
// ───────────────────────────────────────────────────────────────

/**
 * Zeigt die Kinder nur für ein AKTIVES Brand-Profil.
 *
 * Alle anderen Zustände bekommen eine Erklärung statt eines Fehlers:
 * - kein Profil: Hinweis auf die Brand-Registrierung
 * - in Prüfung: Wartehinweis, die Aufträge sind bis zur Freischaltung gesperrt
 * - pausiert/abgelehnt/gesperrt: Hinweis, sich an uns zu wenden
 *
 * Ein Gast landet gar nicht erst hier: GET /brands/me antwortet mit 401, und
 * der Interceptor in services/api.ts leitet auf /login um.
 *
 * `allow` erweitert die erlaubten Zustände — die Profilseite etwa soll auch
 * eine Brand in Prüfung bearbeiten können.
 */
export function BrandGate({
  children,
  allow = ['active'],
}: {
  children: React.ReactNode
  allow?: BrandStanding[]
}) {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { standing, isError, refetch } = useBrandProfile()

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <StatusPanel
            icon={<XCircle className="h-8 w-8 text-white" />}
            title={t('common.error', { defaultValue: 'Fehler' })}
            description={t('brandDashboard.loadFailed', {
              defaultValue: 'Dein Brand-Profil lässt sich gerade nicht laden. Bitte versuche es später erneut.',
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
            icon={<Building2 className="h-8 w-8 text-white" />}
            title={t('brandDashboard.noProfileTitle', { defaultValue: 'Noch kein Brand-Profil' })}
            description={t('brandDashboard.noProfileDesc', {
              defaultValue:
                'Dieser Bereich ist für Marken. Registriere dein Unternehmen, um Aufträge an Creator zu vergeben.',
            })}
            action={
              <Link href={localePath('/register/brand')}>
                <Button variant="gradient">
                  {t('brandDashboard.noProfileButton', { defaultValue: 'Als Marke registrieren' })}
                </Button>
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
            title={t('brandDashboard.pendingTitle', { defaultValue: 'Dein Profil wird geprüft.' })}
            description={t('brandDashboard.pendingDesc', {
              defaultValue:
                'Wir sehen uns deine Angaben an und schalten dich zeitnah frei. Danach kannst du hier Aufträge anlegen.',
            })}
            action={
              <Link href={localePath('/brand/profile')}>
                <Button variant="outline">
                  {t('brandDashboard.editProfile', { defaultValue: 'Profil bearbeiten' })}
                </Button>
              </Link>
            }
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
          title={t('brandDashboard.blockedTitle', { defaultValue: 'Dein Brand-Profil ist derzeit nicht aktiv.' })}
          description={t('brandDashboard.blockedDesc', {
            defaultValue: 'Aufträge sind im Moment nicht möglich. Bei Fragen melde dich bei office@shareyourparty.de.',
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
