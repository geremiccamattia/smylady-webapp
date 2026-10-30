'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Ban, Building2, Clock, LogOut, MailQuestion, TicketCheck, UserCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useRefreshBrandTeam } from '@/hooks/useBrandProfile'
import { authService } from '@/services/auth'
import {
  brandErrorStatus,
  brandService,
  isRateLimited,
  readBrandError,
  type InvitationPreview,
  type InvitationState,
} from '@/services/brand'
import { navigateToPath } from '@/lib/navigation'
import {
  clearPendingBrandInvite,
  readPendingBrandInvite,
  releaseBrandInviteResume,
  savePendingBrandInvite,
} from '@/lib/pendingBrandInvite'
import { LoadingBars, StatusPanel } from '@/components/brand/brandShared'

/**
 * Einladung in eine Brand annehmen: /brand/invite?token=…
 *
 * Liegt in der Route-Gruppe (app), die keinen Login erzwingt; die Vorschau
 * funktioniert auch für Gäste (siehe publicPaths in services/api.ts). Der
 * Token kommt aus window.location statt useSearchParams, wegen des
 * Prerenderings (wie /register?creator=1).
 *
 * Der Token soll nicht weiterwandern. Sobald er gespeichert ist, verschwindet
 * er deshalb aus der Adresse: Die Seite liest ihn dann aus dem Speicher, ein
 * Neuladen funktioniert weiter, und die Rückkehr nach dem Login kommt ohne
 * Token in der URL aus (useResumeBrandInvite).
 */
export default function BrandInvite() {
  // undefined: noch nicht gelesen, null: keiner da.
  const [token, setToken] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('token')?.trim() || null
    if (fromUrl && savePendingBrandInvite(fromUrl)) {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
    // Einmalig beim Laden; Quelle ist die Adresse ausserhalb von React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(fromUrl ?? readPendingBrandInvite())
  }, [])

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardContent className="p-6">
          {token === undefined ? (
            <LoadingBars />
          ) : token === null ? (
            <InvalidState state="unknown" />
          ) : (
            <InviteContent token={token} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InviteContent({ token }: { token: string }) {
  const { t } = useTranslation()

  const preview = useQuery<InvitationPreview>({
    queryKey: ['brandInvitation', token],
    queryFn: () => brandService.previewInvitation(token),
    retry: false,
  })

  const state = preview.data?.state
  useEffect(() => {
    // Ungültig bleibt ungültig: nicht nach dem nächsten Login wieder hierher führen.
    if (state && state !== 'valid') clearPendingBrandInvite()
  }, [state])

  if (preview.isLoading) return <LoadingBars />

  if (preview.isError || !preview.data) {
    return (
      <StatusPanel
        icon={<XCircle className="h-8 w-8 text-white" />}
        title={t('brandInvite.loadFailedTitle', { defaultValue: 'Die Einladung lässt sich gerade nicht laden.' })}
        description={
          isRateLimited(preview.error)
            ? t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' })
            : t('brandInvite.loadFailedDesc', { defaultValue: 'Bitte prüfe deine Verbindung und versuche es noch einmal.' })
        }
        action={
          <Button variant="outline" onClick={() => preview.refetch()}>
            {t('common.retry', { defaultValue: 'Erneut versuchen' })}
          </Button>
        }
      />
    )
  }

  if (preview.data.state !== 'valid') return <InvalidState state={preview.data.state} />

  return <ValidInvitation token={token} preview={preview.data} />
}

/** Ungültige Einladung: eine klare Meldung je Zustand, nie ein Fehlerbildschirm. */
function InvalidState({ state }: { state: Exclude<InvitationState, 'valid'> }) {
  const { t } = useTranslation()
  const localePath = useLocalePath()

  const content = {
    expired: {
      icon: <Clock className="h-8 w-8 text-white" />,
      title: t('brandInvite.expiredTitle', { defaultValue: 'Diese Einladung ist abgelaufen.' }),
      description: t('brandInvite.expiredDesc', {
        defaultValue: 'Bitte den Inhaber der Brand um eine neue Einladung.',
      }),
    },
    used: {
      icon: <TicketCheck className="h-8 w-8 text-white" />,
      title: t('brandInvite.usedTitle', { defaultValue: 'Diese Einladung wurde bereits angenommen.' }),
      description: t('brandInvite.usedDesc', {
        defaultValue: 'Wenn du das warst, findest du die Brand nach dem Anmelden in deinen Einstellungen.',
      }),
    },
    revoked: {
      icon: <Ban className="h-8 w-8 text-white" />,
      title: t('brandInvite.revokedTitle', { defaultValue: 'Diese Einladung wurde zurückgezogen.' }),
      description: t('brandInvite.revokedDesc', {
        defaultValue: 'Bei Fragen wende dich an die Person, die dich eingeladen hat.',
      }),
    },
    unknown: {
      icon: <MailQuestion className="h-8 w-8 text-white" />,
      title: t('brandInvite.unknownTitle', { defaultValue: 'Diese Einladung kennen wir nicht.' }),
      description: t('brandInvite.unknownDesc', {
        defaultValue: 'Prüfe, ob du den Link aus der Mail vollständig geöffnet hast.',
      }),
    },
  }[state]

  return (
    <StatusPanel
      icon={content.icon}
      title={content.title}
      description={content.description}
      action={
        <Link href={localePath('/explore')}>
          <Button variant="outline">{t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}</Button>
        </Link>
      }
    />
  )
}

function ValidInvitation({ token, preview }: { token: string; preview: InvitationPreview }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const localePath = useLocalePath()
  const { user, isLoading: authLoading } = useAuth()
  const refreshTeam = useRefreshBrandTeam()
  // Meldung unter dem Knopf. `wrongAccount` bietet zusätzlich das Abmelden an.
  const [problem, setProblem] = useState<{ message: string; wrongAccount: boolean } | null>(null)

  const accept = useMutation({
    mutationFn: () => brandService.acceptInvitation(token),
    onSuccess: async (result) => {
      clearPendingBrandInvite()
      await refreshTeam({ account: true })
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandInvite.acceptedToast', {
          company: result.companyName || preview.companyName || '',
          defaultValue: 'Willkommen im Team von {{company}}.',
        }),
      })
      router.replace(localePath('/brand'))
    },
    onError: (error: unknown) => {
      const status = brandErrorStatus(error)
      if (status === 403) {
        // Die Meldung des Backends nennt die eingeladene Adresse (maskiert).
        setProblem({
          message: readBrandError(
            error,
            t('brandInvite.wrongAccount', {
              defaultValue: 'Diese Einladung gilt für eine andere E-Mail-Adresse.',
            }),
          ),
          wrongAccount: true,
        })
      } else if (status === 404) {
        clearPendingBrandInvite()
        setProblem({
          message: t('brandInvite.acceptInvalid', { defaultValue: 'Diese Einladung ist nicht mehr gültig.' }),
          wrongAccount: false,
        })
      } else if (status === 409) {
        setProblem({
          message: readBrandError(
            error,
            t('brandInvite.acceptConflict', {
              defaultValue: 'Diese Einladung kann mit deinem Konto nicht angenommen werden.',
            }),
          ),
          wrongAccount: false,
        })
      } else {
        setProblem({
          message: isRateLimited(error)
            ? t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' })
            : t('brandInvite.acceptFailed', { defaultValue: 'Die Einladung konnte nicht angenommen werden.' }),
          wrongAccount: false,
        })
      }
    },
  })

  const decline = () => {
    clearPendingBrandInvite()
    router.replace(localePath('/explore'))
  }

  // Über die volle Navigation, nicht logout() aus dem AuthContext: Der schickt
  // auf /explore, hier geht es direkt zum Anmelden mit dem richtigen Konto.
  const switchAccount = () => {
    authService.logout()
    releaseBrandInviteResume()
    navigateToPath(localePath('/login'))
  }

  return (
    <div className="text-center py-4 px-2">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]">
        <Building2 className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-xl font-bold mb-2">
        {t('brandInvite.title', {
          company: preview.companyName ?? '',
          defaultValue: 'Einladung ins Team von {{company}}',
        })}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('brandInvite.description', {
          email: preview.maskedEmail ?? '',
          defaultValue: 'Diese Einladung gilt für die Adresse {{email}}.',
        })}
      </p>

      {authLoading ? (
        <LoadingBars />
      ) : user ? (
        <div className="space-y-3">
          <Button variant="gradient" className="w-full gap-2" loading={accept.isPending} onClick={() => accept.mutate()}>
            <UserCheck className="h-4 w-4" />
            {t('brandInvite.accept', { defaultValue: 'Einladung annehmen' })}
          </Button>
          <Button variant="ghost" className="w-full" disabled={accept.isPending} onClick={decline}>
            {t('brandInvite.decline', { defaultValue: 'Nicht annehmen' })}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            {t('brandInvite.guestHint', {
              defaultValue: 'Melde dich an oder registriere dich. Verwende dafür unbedingt die eingeladene Adresse.',
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="gradient" className="flex-1" asChild>
              <Link href={localePath('/login')}>{t('brandInvite.login', { defaultValue: 'Anmelden' })}</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href={localePath('/register')}>{t('brandInvite.register', { defaultValue: 'Registrieren' })}</Link>
            </Button>
          </div>
        </div>
      )}

      {problem && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-3" role="alert">
          <p>{problem.message}</p>
          {problem.wrongAccount && (
            <Button variant="outline" size="sm" className="gap-2" onClick={switchAccount}>
              <LogOut className="h-4 w-4" />
              {t('brandInvite.switchAccount', { defaultValue: 'Abmelden und anderes Konto verwenden' })}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
