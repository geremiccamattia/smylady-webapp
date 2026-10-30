'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useRefreshBrandTeam } from '@/hooks/useBrandProfile'
import { MY_BRAND_INVITATIONS_QUERY_KEY, useMyBrandInvitations } from '@/hooks/useMyBrandInvitations'
import { clearPendingBrandInvite } from '@/lib/pendingBrandInvite'
import {
  brandErrorStatus,
  brandService,
  readBrandError,
  readBrandTeamError,
  type MyBrandInvitation,
} from '@/services/brand'

/** Ausgeblendete Einladungen gelten für die Browser-Sitzung; die Einstellungen zeigen sie weiter. */
const DISMISSED_KEY = 'brandInvitationBannerDismissed'

function readDismissed(): string[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDismissed(ids: string[]): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(ids))
  } catch {
    // Dann erscheint der Banner auf der nächsten Seite wieder.
  }
}

/**
 * Offene Einladungen unter dem Header. Sitzt im Layout, das auch entscheidet,
 * auf welchen Seiten der Banner fehlt. Eine neue Einladung erscheint auch dann,
 * wenn frühere ausgeblendet wurden.
 */
export function BrandInvitationBanner() {
  const { t } = useTranslation()
  const { invitations } = useMyBrandInvitations()
  const [dismissed, setDismissed] = useState<string[]>(readDismissed)

  const visible = invitations.filter((invitation) => !dismissed.includes(invitation.id))
  if (visible.length === 0) return null

  const dismiss = () => {
    const next = [...dismissed, ...visible.map((invitation) => invitation.id)]
    setDismissed(next)
    saveDismissed(next)
  }

  return (
    <div className="container mx-auto px-4 pt-4">
      <Card>
        <CardContent className="flex items-start gap-2 p-3">
          <div
            className="min-w-0 flex-1 divide-y"
            role="region"
            aria-label={t('brandInviteInbox.bannerLabel', { defaultValue: 'Offene Brand-Einladungen' })}
          >
            {visible.map((invitation) => (
              <BrandInvitationRow key={invitation.id} invitation={invitation} />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={t('brandInviteInbox.dismiss', { defaultValue: 'Ausblenden' })}
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/** Eine Einladung mit Annehmen und Ablehnen; auch in den Einstellungen im Einsatz. */
export function BrandInvitationRow({ invitation }: { invitation: MyBrandInvitation }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const refreshTeam = useRefreshBrandTeam()
  const [confirmingDecline, setConfirmingDecline] = useState(false)

  const showError = (description: string) =>
    toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }), description })

  const rateLimited = t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' })
  const invalid = t('brandInviteInbox.invalid', { defaultValue: 'Diese Einladung ist nicht mehr gültig.' })

  const removeFromList = () =>
    queryClient.setQueryData<MyBrandInvitation[]>(MY_BRAND_INVITATIONS_QUERY_KEY, (current) =>
      current?.filter((entry) => entry.id !== invitation.id),
    )

  const accept = useMutation({
    mutationFn: () => brandService.acceptMyInvitation(invitation.id),
    onSuccess: async (result) => {
      clearPendingBrandInvite()
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandInviteInbox.acceptedToast', {
          company: result.companyName || invitation.companyName,
          defaultValue: 'Willkommen im Team von {{company}}.',
        }),
      })
      // Lädt Nutzerdaten, Brand-Profil und Einladungsliste neu (alles unter ['brand']).
      await refreshTeam({ account: true })
      router.push(localePath('/brand'))
    },
    onError: async (error: unknown) => {
      const status = brandErrorStatus(error)
      if (status === 404) {
        showError(invalid)
      } else if (status === 409) {
        showError(
          readBrandError(
            error,
            t('brandInviteInbox.conflict', {
              defaultValue: 'Diese Einladung kann mit deinem Konto nicht angenommen werden.',
            }),
          ),
        )
      } else {
        showError(
          readBrandTeamError(
            error,
            t('brandInviteInbox.acceptFailed', { defaultValue: 'Die Einladung konnte nicht angenommen werden.' }),
            rateLimited,
          ),
        )
      }
      // Die Liste kann überholt sein, das Konto vielleicht schon in einer Brand.
      if (status === 404 || status === 409) await refreshTeam({ account: true })
    },
  })

  const decline = useMutation({
    mutationFn: () => brandService.declineMyInvitation(invitation.id),
    onSuccess: () => {
      // Sonst führte die Rückkehr noch einmal zur abgelehnten Einladung.
      clearPendingBrandInvite()
      removeFromList()
      toast({ description: t('brandInviteInbox.declinedToast', { defaultValue: 'Einladung abgelehnt.' }) })
    },
    onError: (error: unknown) => {
      setConfirmingDecline(false)
      if (brandErrorStatus(error) === 404) {
        removeFromList()
        showError(invalid)
        return
      }
      showError(
        readBrandTeamError(
          error,
          t('brandInviteInbox.declineFailed', { defaultValue: 'Die Einladung konnte nicht abgelehnt werden.' }),
          rateLimited,
        ),
      )
    },
  })

  const busy = accept.isPending || decline.isPending
  // Ohne Namen setzt das Backend den Firmennamen ein; „X (von X)" sagt nichts.
  const hasInviter = invitation.invitedByName && invitation.invitedByName !== invitation.companyName

  return (
    <div className="flex flex-col gap-3 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex min-w-0 items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 break-words">
          {hasInviter
            ? t('brandInviteInbox.invited', {
                company: invitation.companyName,
                inviter: invitation.invitedByName,
                defaultValue: '{{company}} hat dich eingeladen (von {{inviter}})',
              })
            : t('brandInviteInbox.invitedByBrand', {
                company: invitation.companyName,
                defaultValue: '{{company}} hat dich eingeladen',
              })}
        </span>
      </p>

      {confirmingDecline ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('brandInviteInbox.declineConfirm', { defaultValue: 'Einladung wirklich ablehnen?' })}
          </span>
          <Button variant="destructive" size="sm" loading={decline.isPending} onClick={() => decline.mutate()}>
            {t('brandInviteInbox.decline', { defaultValue: 'Ablehnen' })}
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmingDecline(false)}>
            {t('brandInviteInbox.declineKeep', { defaultValue: 'Behalten' })}
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 gap-2">
          <Button variant="gradient" size="sm" loading={accept.isPending} disabled={busy} onClick={() => accept.mutate()}>
            {t('brandInviteInbox.accept', { defaultValue: 'Annehmen' })}
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmingDecline(true)}>
            {t('brandInviteInbox.decline', { defaultValue: 'Ablehnen' })}
          </Button>
        </div>
      )}
    </div>
  )
}
