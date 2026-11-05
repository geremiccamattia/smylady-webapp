'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useCreatorProfile } from '@/hooks/useCreatorProfile'
import { StripeConnectCard } from '@/components/settings/StripeConnectCard'
import { SpotifyConnectCard } from '@/components/settings/SpotifyConnectCard'
import { BalanceCard } from '@/components/settings/BalanceCard'
import { ChangeEmailModal } from '@/components/settings/ChangeEmailModal'
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'
import { TutorialsCard } from '@/components/settings/TutorialsCard'
import { BrandCard } from '@/components/settings/BrandCard'
import { BrandInvitationsCard } from '@/components/settings/BrandInvitationsCard'
import { CreatorCard } from '@/components/settings/CreatorCard'
import { openCookieSettings } from '@/components/CookieConsent'
import {
  MapPin,
  Ticket,
  Bell,
  Shield,
  Globe,
  ChevronRight,
  Moon,
  Sun,
  Mail,
  Lock,
  Trash2,
  User,
  Download,
  Loader2,
} from 'lucide-react'
import { authService } from '@/services/auth'
import {
  isLiveLocationEnabled,
  setLiveLocationEnabled,
  isTicketmasterEnabled,
  setTicketmasterEnabled,
  requestLocationPermission,
} from '@/services/location'

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-primary' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}

function SettingsContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, refreshUser, updateUser } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Settings state
  const [liveLocation, setLiveLocation] = useState(false)
  const [ticketmaster, setTicketmaster] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  // Werbe-Push: Zustand aus GET /users/me, Default aus
  const [marketingPush, setMarketingPush] = useState(false)
  const [marketingPushSaving, setMarketingPushSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setMarketingPush(user?.marketingPushConsent === true)
  }, [user?.marketingPushConsent])

  const handleMarketingPushToggle = async (enabled: boolean) => {
    const previous = marketingPush
    setMarketingPush(enabled)
    setMarketingPushSaving(true)
    try {
      const result = await authService.setMarketingPushConsent(enabled)
      const saved = typeof result?.marketingPushConsent === 'boolean' ? result.marketingPushConsent : enabled
      setMarketingPush(saved)
      if (user) {
        updateUser({
          ...user,
          marketingPushConsent: saved,
          marketingPushConsentAt: result?.marketingPushConsentAt ?? user.marketingPushConsentAt,
        })
      }
      toast({
        title: saved
          ? t('settings.marketingPushOn', { defaultValue: 'Werbliche Push-Nachrichten aktiviert' })
          : t('settings.marketingPushOff', { defaultValue: 'Werbliche Push-Nachrichten deaktiviert' }),
      })
    } catch {
      setMarketingPush(previous)
      toast({ variant: 'destructive', title: t('errors.general'), description: t('errors.tryAgain') })
    } finally {
      setMarketingPushSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { blob, fileName } = await authService.exportData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Kurz warten, sonst bricht manch ein Browser den Download ab.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast({ title: t('settings.exportDone', { defaultValue: 'Datenexport heruntergeladen' }) })
    } catch {
      toast({
        variant: 'destructive',
        title: t('settings.exportFailed', { defaultValue: 'Export fehlgeschlagen' }),
        description: t('errors.tryAgain'),
      })
    } finally {
      setExporting(false)
    }
  }

  // Modal states
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  // Wer hier Stripe verbindet: ein Veranstalter (Ticketerlöse) oder ein
  // aktiver Creator (Vergütung aus Brand-Aufträgen) — dieselbe Weiche wie in
  // StripeConnectCard. Creator ist keine Rolle im Token, sondern ein aktives
  // Creator-Profil; dessen Stand muss da sein, bevor der Toast den Text wählt.
  const isOrganizer = user?.role === 'organizer'
  const { standing: creatorStanding, isError: creatorStandingError } = useCreatorProfile()
  const isCreator = !isOrganizer && creatorStanding === 'active'
  const roleKnown = isOrganizer || creatorStanding !== undefined || creatorStandingError

  // Handle Stripe Connect callback
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe')
    if (!stripeStatus || !roleKnown) return

    if (stripeStatus === 'success') {
      toast({
        title: isCreator
          ? t('settings.stripeConnectedCreator', { defaultValue: 'Auszahlungskonto verbunden' })
          : t('settings.stripeConnected'),
        description: isCreator
          ? t('settings.stripeConnectedCreatorDesc', {
              defaultValue: 'Dein Auszahlungskonto ist verbunden. Vergütungen aus Brand-Aufträgen gehen dorthin.',
            })
          : t('settings.stripeConnectedDesc'),
      })
      // Remove the query parameter
      router.replace(pathname)
    } else if (stripeStatus === 'refresh') {
      toast({
        variant: 'destructive',
        title: t('settings.stripeIncomplete'),
        description: t('settings.stripeIncompleteDesc'),
      })
      // Remove the query parameter
      router.replace(pathname)
    }
    // t fehlt bewusst: Die Funktion wechselt bei einem Sprachwechsel die
    // Referenz. Aufgenommen liefe der Effekt dann erneut und könnte die
    // Stripe-Rückmeldung ein zweites Mal einblenden. Ausgelöst werden soll sie
    // allein durch den Query-Parameter der Rückkehr (und den bekannten Stand).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, pathname, toast, roleKnown, isCreator])

  // Load settings on mount
  useEffect(() => {
    setLiveLocation(isLiveLocationEnabled())
    setTicketmaster(isTicketmasterEnabled())

    // Check dark mode preference
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request permission first
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        toast({
          variant: 'destructive',
          title: t('settings.locationDenied'),
          description: t('settings.locationDeniedDesc'),
        })
        return
      }
    }

    setLiveLocation(enabled)
    setLiveLocationEnabled(enabled)

    toast({
      title: enabled ? t('settings.liveLocationEnabled') : t('settings.liveLocationDisabled'),
      description: enabled
        ? t('settings.liveLocationEnabledDesc')
        : t('settings.liveLocationDisabledDesc'),
    })
  }

  const handleTicketmasterToggle = (enabled: boolean) => {
    setTicketmaster(enabled)
    setTicketmasterEnabled(enabled)

    toast({
      title: enabled ? t('settings.ticketmasterEnabled') : t('settings.ticketmasterDisabled'),
      description: enabled
        ? t('settings.ticketmasterEnabledDesc')
        : t('settings.ticketmasterDisabledDesc'),
    })
  }

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled)
    if (enabled) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Balance */}
      <BalanceCard />

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('settings.location')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.liveLocation')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.liveLocationDesc')}
              </p>
            </div>
            <ToggleSwitch
              enabled={liveLocation}
              onChange={handleLocationToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* External Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {t('settings.externalEvents')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.ticketmasterIntegration')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.ticketmasterDesc')}
              </p>
            </div>
            <ToggleSwitch
              enabled={ticketmaster}
              onChange={handleTicketmasterToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t('settings.accountSecurity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowChangeEmail(true)}
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('settings.changeEmail')}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowChangePassword(true)}
          >
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('settings.changePassword')}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {/* Auskunft / Datenübertragbarkeit (Art. 15, 20 DSGVO) */}
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={handleExport}
            disabled={exporting}
          >
            <span className="flex items-center gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t('settings.exportData', { defaultValue: 'Meine Daten exportieren' })}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteAccount(true)}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t('settings.deleteAccount')}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Offene Brand-Einladungen, auch wenn der Banner ausgeblendet ist.
          Rendert sich selbst weg, wenn keine offen ist. */}
      <BrandInvitationsCard />

      {/* Brand-Bereich: Dashboard und Brand-Profil. Rendert sich selbst weg,
          wenn das Konto keine Brand ist — siehe BrandCard. */}
      <BrandCard />

      {/* Creator Club. Rendert sich selbst weg, solange der Stand der
          Bewerbung nicht feststeht, und für Brand-Konten — siehe CreatorCard. */}
      <CreatorCard />

      {/* Stripe Connect for Organizers */}
      <StripeConnectCard />

      {/* Spotify Connect */}
      <SpotifyConnectCard />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('settings.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/*
            * Werbe-Push nur mit Opt-in (H3, § 174 TKG / Art. 6 Abs. 1 lit. a DSGVO).
            * Ersetzt den früheren Schalter, der nichts gespeichert hat. Admin-
            * Ankündigungen gehen serverseitig nur an marketingPushConsent: true;
            * Push zu Tickets, Nachrichten usw. bleibt davon unberührt.
            */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {t('settings.marketingPush', { defaultValue: 'Werbliche Push-Nachrichten' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('settings.marketingPushDesc', {
                  defaultValue: 'Neuigkeiten und Aktionen von Share Your Party. Freiwillig, jederzeit hier abschaltbar.',
                })}
              </p>
            </div>
            <ToggleSwitch
              enabled={marketingPush}
              onChange={handleMarketingPushToggle}
              disabled={marketingPushSaving || !user}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            {t('settings.appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.darkMode')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.darkModeDesc')}
              </p>
            </div>
            <ToggleSwitch
              enabled={darkMode}
              onChange={handleDarkModeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Video-Tutorials. Rendert sich selbst weg, wenn das Konto nicht
          freigeschaltet ist — siehe TutorialsCard. */}
      <TutorialsCard />

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('settings.securityPrivacy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link href="/safety-companions">
              {t('settings.safetyCompanions')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link href="/blocked-users">
              {t('settings.blockedUsers')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link href="/privacy">
              {t('settings.privacy')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link href="/terms">
              {t('settings.termsShort')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link href="/imprint">
              {t('settings.impressum')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" onClick={() => openCookieSettings()}>
            {t('legal.cookieSettings', { defaultValue: 'Cookie-Einstellungen' })}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('settings.appInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t('settings.appName')}</p>
            <p>{t('settings.version')}</p>
            <p>{t('settings.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ChangeEmailModal
        open={showChangeEmail}
        onClose={() => setShowChangeEmail(false)}
        onSuccess={() => refreshUser?.()}
        currentEmail={user?.email}
      />

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <DeleteAccountModal
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />
    </div>
  )
}

export default function Settings() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
