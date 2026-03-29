import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { StripeConnectCard } from '@/components/settings/StripeConnectCard'
import { ChangeEmailModal } from '@/components/settings/ChangeEmailModal'
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'
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
} from 'lucide-react'
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

export default function Settings() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Settings state
  const [liveLocation, setLiveLocation] = useState(false)
  const [ticketmaster, setTicketmaster] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Modal states
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  // Handle Stripe Connect callback
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe')

    if (stripeStatus === 'success') {
      toast({
        title: t('settings.stripeConnected'),
        description: t('settings.stripeConnectedDesc'),
      })
      // Remove the query parameter
      setSearchParams({}, { replace: true })
    } else if (stripeStatus === 'refresh') {
      toast({
        variant: 'destructive',
        title: t('settings.stripeIncomplete'),
        description: t('settings.stripeIncompleteDesc'),
      })
      // Remove the query parameter
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, toast])

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

      {/* Stripe Connect for Organizers */}
      <StripeConnectCard />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('settings.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.pushNotifications')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.pushNotificationsDesc')}
              </p>
            </div>
            <ToggleSwitch
              enabled={notifications}
              onChange={setNotifications}
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
            <Link to="/safety-companions">
              {t('settings.safetyCompanions')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link to="/blocked-users">
              {t('settings.blockedUsers')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link to="/privacy">
              {t('settings.privacy')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link to="/terms">
              {t('settings.termsShort')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-between" asChild>
            <Link to="/imprint">
              {t('settings.impressum')}
              <ChevronRight className="h-4 w-4" />
            </Link>
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
