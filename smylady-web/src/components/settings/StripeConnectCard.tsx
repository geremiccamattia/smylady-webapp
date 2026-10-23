'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  useCreateAccountLink,
  useGetAccountBalance,
  useGetConnectedAccount,
  useDisconnectAccount,
  useGetStripeDashboardLink,
} from '@/hooks/useStripe'
import { useAuth } from '@/contexts/AuthContext'
import { useCreatorProfile } from '@/hooks/useCreatorProfile'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { formatPrice } from '@/lib/utils'
import {
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
  TrendingUp,
  Settings,
  LogOut,
  RefreshCw,
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
import { navigateToExternalUrl, STRIPE_HOSTS } from '@/lib/navigation'
import { StripeRequirements } from '@/components/settings/StripeRequirements'

function StripeConnectCardContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  // Veranstalter (Ticketerlöse), aktive Brands (Ticketerlöse aus ihren
  // Events, Pflicht vor dem ersten Auftrag) und aktive Creator (Vergütung aus
  // Brand-Aufträgen) verbinden dasselbe Stripe-Konto; Brands bekommen die
  // Texte der Veranstalter. Creator und Brand sind keine Rollen im Token,
  // sondern aktive Profile.
  const isOrganizer = user?.role === 'organizer'
  const { standing: creatorStanding } = useCreatorProfile()
  const { standing: brandStanding } = useBrandProfile()
  const isCreator = creatorStanding === 'active'
  const isBrand = brandStanding === 'active'
  const visible = Boolean(isOrganizer || isBrand || isCreator)
  const variant: 'organizer' | 'creator' = isOrganizer || isBrand ? 'organizer' : 'creator'

  // Fetch connected account status
  const {
    data: connectedAccount,
    isLoading: isLoadingAccount,
    isError: isAccountError,
    error: accountError,
    isFetching: isFetchingAccount,
    refetch: refetchAccount,
  } = useGetConnectedAccount(visible)
  // 403: Der Endpunkt ist nur für Veranstalter und aktive Creator — etwa,
  // wenn das Creator-Profil gerade pausiert wurde und die Seite noch offen ist.
  const accountForbidden = axios.isAxiosError(accountError) && accountError.response?.status === 403

  // Determine account status - Backend returns accountStatus field
  const accountStatus = connectedAccount?.accountStatus
  const isConnected = accountStatus === 'active'
  const needsOnboarding = accountStatus === 'incomplete' || accountStatus === 'restricted'
  // Ein Fehler ist KEIN „nicht verbunden": Sonst böte die Karte das Verbinden
  // an, obwohl das Konto längst steht.
  const isNotConnected = !isAccountError && (!accountStatus || accountStatus === 'not connected')

  // Aus dem Creator-Bereich kommt der Link /settings#payout; die Karte lädt
  // erst, danach springt die Seite hin — einmal.
  const scrolledToPayout = useRef(false)
  useEffect(() => {
    if (scrolledToPayout.current || !visible || isLoadingAccount) return
    if (typeof window === 'undefined' || window.location.hash !== '#payout') return
    scrolledToPayout.current = true
    document.getElementById('payout')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [visible, isLoadingAccount])

  // Fetch account balance only when connected
  const {
    data: balance,
    refetch: refetchBalance,
  } = useGetAccountBalance(visible && isConnected)

  // Mutations
  const { mutate: createAccountLink } = useCreateAccountLink()
  const { mutate: disconnectAccount, isPending: isDisconnecting } = useDisconnectAccount()
  const { mutate: getDashboardLink, isPending: isGettingDashboard } = useGetStripeDashboardLink()

  // Refetch data when returning from Stripe Connect
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe')
    if (stripeStatus === 'success' || stripeStatus === 'refresh') {
      // Invalidate and refetch account data
      queryClient.invalidateQueries({ queryKey: ['connected-account'] })
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
      refetchAccount()
      refetchBalance()
    }
  }, [searchParams, queryClient, refetchAccount, refetchBalance])

  const handleConnect = () => {
    setIsConnecting(true)
    createAccountLink(undefined, {
      onSuccess: (data) => {
        if (data.url) {
          // Stripe liefert je nach Flow connect.stripe.com oder eine *.stripe.com-Subdomain.
          // navigateToExternalUrl erzwingt HTTPS + diese Hosts, damit ein manipulierter
          // Backend-Response nicht auf eine fremde Domain umleiten kann.
          const redirected = navigateToExternalUrl(data.url, STRIPE_HOSTS)
          if (!redirected) {
            // Ohne Reset bliebe der Button dauerhaft im Ladezustand hängen
            toast({
              variant: 'destructive',
              title: t('common.error'),
              description: t('settings.stripe.linkFailed', { defaultValue: 'Stripe-Verbindung konnte nicht erstellt werden.' }),
            })
            setIsConnecting(false)
          }
        } else {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('settings.stripe.linkFailed', { defaultValue: 'Stripe-Verbindung konnte nicht erstellt werden.' }),
          })
          setIsConnecting(false)
        }
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description:
            error.response?.data?.message ||
            t('settings.stripe.connectFailed', { defaultValue: 'Stripe-Verbindung fehlgeschlagen.' }),
        })
        setIsConnecting(false)
      },
    })
  }

  const handleOpenDashboard = () => {
    getDashboardLink(undefined, {
      onSuccess: (data) => {
        if (data.url) {
          window.open(data.url, '_blank')
        }
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description:
            error.response?.data?.message ||
            t('settings.stripe.dashboardFailed', { defaultValue: 'Dashboard konnte nicht geöffnet werden.' }),
        })
      },
    })
  }

  const handleDisconnect = () => {
    disconnectAccount(undefined, {
      onSuccess: () => {
        toast({
          title: t('settings.stripe.disconnectedTitle', { defaultValue: 'Stripe getrennt' }),
          description: t('settings.stripe.disconnectedDesc', { defaultValue: 'Dein Stripe-Konto wurde erfolgreich getrennt.' }),
        })
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description:
            error.response?.data?.message || t('settings.stripe.disconnectFailed', { defaultValue: 'Trennung fehlgeschlagen.' }),
        })
      },
    })
  }

  if (!visible) {
    return null
  }

  if (isLoadingAccount) {
    return (
      <Card id="payout">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="payout">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {variant === 'creator'
            ? t('settings.payout.title', { defaultValue: 'Auszahlungskonto' })
            : t('settings.stripe.title', { defaultValue: 'Zahlungen' })}
        </CardTitle>
        <CardDescription>
          {variant === 'creator'
            ? t('settings.payout.description', {
                defaultValue: 'Verbinde dein Stripe-Konto, damit wir deine Vergütung aus Brand-Aufträgen nach dem Event auszahlen können.',
              })
            : t('settings.stripe.description', {
                defaultValue: 'Verbinde dein Stripe-Konto um Zahlungen für deine Events zu erhalten.',
              })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAccountError ? (
          // Fehler beim Laden: eigener Zustand mit Wiederholung statt „nicht verbunden".
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              {accountForbidden
                ? t('settings.stripe.forbidden', {
                    defaultValue: 'Das Auszahlungskonto gibt es nur für Veranstalter und freigeschaltete Creator.',
                  })
                : t('settings.stripe.loadFailed', {
                    defaultValue: 'Der Stand deines Stripe-Kontos lässt sich gerade nicht laden.',
                  })}
            </span>
            {!accountForbidden && (
              <Button variant="outline" size="sm" onClick={() => refetchAccount()} disabled={isFetchingAccount}>
                {t('common.retry', { defaultValue: 'Erneut versuchen' })}
              </Button>
            )}
          </div>
        ) : isConnected ? (
          <>
            {/* Connected Status */}
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                {t('settings.stripe.connected', { defaultValue: 'Stripe verbunden' })}
              </span>
            </div>

            {/* Balance Display - Backend returns availableBalance in cents */}
            {balance && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm">
                      {t('settings.stripe.available', { defaultValue: 'Verfügbar' })}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(balance.availableBalance ?? balance.available ?? 0)}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">
                      {t('settings.stripe.status', { defaultValue: 'Status' })}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-green-600 capitalize">
                    {balance.accountStatus || accountStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleOpenDashboard}
                disabled={isGettingDashboard}
              >
                {isGettingDashboard ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                {t('settings.stripe.dashboard', { defaultValue: 'Stripe Dashboard' })}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  refetchAccount()
                  refetchBalance()
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('common.refresh')}
              </Button>

              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDisconnectDialog(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('settings.stripe.disconnect', { defaultValue: 'Trennen' })}
              </Button>

              <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('settings.stripe.disconnectTitle', { defaultValue: 'Stripe trennen?' })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {/* Creator haben keine „bestehenden Events" — bei ihnen geht es um die Vergütung. */}
                      {variant === 'creator'
                        ? t('settings.stripeDisconnectWarningCreator', {
                            defaultValue:
                              'Ohne Auszahlungskonto können wir deine Vergütung aus Brand-Aufträgen nicht auszahlen. Du kannst es jederzeit wieder verbinden.',
                          })
                        : t('settings.stripeDisconnectWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowDisconnectDialog(false)}>
                      {t('common.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleDisconnect()
                        setShowDisconnectDialog(false)
                      }}
                      disabled={isDisconnecting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDisconnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {t('settings.stripe.confirmDisconnect', { defaultValue: 'Ja, trennen' })}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : needsOnboarding ? (
          <>
            {/* Needs to complete onboarding */}
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                {accountStatus === 'restricted'
                  ? t('settings.stripe.restricted', { defaultValue: 'Konto eingeschränkt' })
                  : t('settings.stripe.incomplete', { defaultValue: 'Einrichtung unvollständig' })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {accountStatus === 'restricted'
                ? t('settings.stripe.restrictedMessage', {
                    defaultValue: 'Dein Stripe-Konto ist eingeschränkt. Bitte vervollständige die erforderlichen Informationen.',
                  })
                : t('settings.stripe.completeSetup', {
                    defaultValue: 'Bitte schließe die Stripe-Einrichtung ab, um Zahlungen zu erhalten.',
                  })}
            </p>
            {/* Warum nicht freigeschaltet: offene Punkte und Prüffehler von Stripe.
                Ohne solche Angaben (oder bei älterem Backend) erscheint nichts. */}
            <StripeRequirements account={connectedAccount} />
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.stripe.completeSetupBtn', { defaultValue: 'Einrichtung fortsetzen' })}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </>
        ) : isNotConnected ? (
          <>
            {/* Not connected */}
            <p className="text-sm text-muted-foreground">
              {variant === 'creator'
                ? t('settings.payout.notConnected', {
                    defaultValue:
                      'Noch kein Auszahlungskonto. Die Einrichtung bei Stripe dauert nur wenige Minuten – danach landet deine Vergütung direkt auf deinem Bankkonto.',
                  })
                : t('settings.stripe.notConnected', {
                    defaultValue:
                      'Verbinde dein Stripe-Konto, um Zahlungen für Tickets zu erhalten. Die Einrichtung dauert nur wenige Minuten.',
                  })}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleConnect} disabled={isConnecting} className="w-full sm:w-auto">
                {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CreditCard className="h-4 w-4 mr-2" />
                {t('settings.stripe.connect', { defaultValue: 'Stripe verbinden' })}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('settings.stripe.secureNote', {
                  defaultValue: 'Sichere und schnelle Auszahlungen direkt auf dein Bankkonto.',
                })}
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function StripeConnectCard() {
  return (
    <Suspense>
      <StripeConnectCardContent />
    </Suspense>
  )
}
