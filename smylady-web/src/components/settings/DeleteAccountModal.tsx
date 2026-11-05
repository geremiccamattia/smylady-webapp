'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { brandErrorStatus, readBrandTeamError } from '@/services/brand'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SUPPORT_EMAIL = 'office@shareyourparty.de'
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Konto löschen')}`

interface DeleteAccountModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Kontolöschung in zwei Schritten (K6, API-Vertrag 05.11.2026):
 * 1. „Code anfordern" → POST /users/request-deletion schickt einen Code an die
 *    Konto-E-Mail.
 * 2. Code eingeben → DELETE /users mit Body { otp }.
 * Ein gestohlenes Token allein reicht damit nicht mehr, um ein Konto zu löschen.
 */
export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const localePath = useLocalePath()
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // 409 vom Lösch-Endpunkt: Ein Inhaber mit Team muss die Brand erst übertragen.
  // Die Meldung nennt die Inhaberschaft nur in diesem Fall, nicht bei offenen Aufträgen.
  const [showTeamLink, setShowTeamLink] = useState(false)
  // Jeder andere 409, etwa offene Aufträge: Hier hilft nur der Support weiter.
  const [showSupportLink, setShowSupportLink] = useState(false)
  const { role } = useBrandProfile()

  const resetErrors = () => {
    setDeleteError(null)
    setShowTeamLink(false)
    setShowSupportLink(false)
  }

  const handleRequestCode = async () => {
    setLoading(true)
    resetErrors()
    try {
      await authService.requestAccountDeletion()
      setStep('confirm')
      toast({
        title: t('settings.deleteCodeSent', { defaultValue: 'Code gesendet' }),
        description: t('settings.deleteCodeSentDesc', {
          email: user?.email ?? '',
          defaultValue: 'Wir haben dir einen Bestätigungscode an deine E-Mail-Adresse geschickt.',
        }),
      })
    } catch (error: unknown) {
      setDeleteError(readBrandTeamError(error, t('errors.general'), t('common.rateLimited')))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const code = otp.trim()
    if (!code) return

    setLoading(true)
    resetErrors()
    try {
      await authService.deleteAccount(code)
      toast({
        title: t('settings.accountDeleted'),
        description: t('settings.accountDeletedDesc'),
      })
      handleClose()
      // Logout and redirect
      logout()
    } catch (error: unknown) {
      const status = brandErrorStatus(error)
      if (status === 400 || status === 401) {
        setDeleteError(t('settings.deleteCodeInvalid', { defaultValue: 'Der Code ist falsch oder abgelaufen.' }))
        return
      }
      const errorMessage = readBrandTeamError(error, t('errors.general'), t('common.rateLimited'))
      setDeleteError(errorMessage)
      const conflict = status === 409
      const teamRule = conflict && /inhaberschaft/i.test(errorMessage)
      setShowTeamLink(teamRule)
      setShowSupportLink(conflict && !teamRule)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('request')
    setOtp('')
    setLoading(false)
    resetErrors()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t('settings.deleteAccount')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.cannotBeUndone')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-destructive">{t('settings.warning')}</p>
              <p className="text-muted-foreground">
                {t('settings.deleteWarningDesc')}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>{t('settings.deleteInfo1')}</li>
                <li>{t('settings.deleteInfo2')}</li>
                <li>{t('settings.deleteInfo3')}</li>
                <li>{t('settings.deleteInfo4')}</li>
                {role === 'owner' && (
                  <li>
                    {t('settings.deleteInfoBrand', {
                      defaultValue: 'Deine Brand wird gelöscht. Das geht nur, wenn kein Team besteht und keine Aufträge offen oder bezahlt sind.',
                    })}
                  </li>
                )}
                <li>{t('settings.deleteInfo5')}</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                {t('settings.deleteRetentionNote', {
                  defaultValue:
                    'Zahlungs- und Ticketdaten müssen wir aus steuerrechtlichen Gründen 7 Jahre aufbewahren (§ 132 BAO). Sie werden pseudonymisiert und nicht mehr mit deinem Namen oder deiner E-Mail-Adresse verknüpft.',
                })}
              </p>
            </div>
          </div>

          {step === 'confirm' && (
            <div className="space-y-2">
              <Label htmlFor="deleteOtp">
                {t('settings.deleteCodeLabel', { defaultValue: 'Bestätigungscode aus der E-Mail' })}
              </Label>
              <Input
                id="deleteOtp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                maxLength={10}
              />
              <button
                type="button"
                className="text-xs text-primary hover:underline disabled:opacity-50"
                onClick={handleRequestCode}
                disabled={loading}
              >
                {t('settings.deleteCodeResend', { defaultValue: 'Code erneut senden' })}
              </button>
            </div>
          )}

          {deleteError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm" role="alert">
              {deleteError}
            </div>
          )}

          {showTeamLink && (
            <Link href={localePath('/brand/team')} onClick={handleClose} className="text-sm text-primary hover:underline">
              {t('brandTeam.goToTeam', { defaultValue: 'Zum Team' })}
            </Link>
          )}

          {showSupportLink && (
            <div className="space-y-1">
              <a href={SUPPORT_MAILTO} className="text-sm text-primary hover:underline">
                {t('settings.contactSupport', { defaultValue: 'Support kontaktieren' })}
              </a>
              {/* Der mailto:-Link tut ohne Standard-Mailprogramm nichts. */}
              <p className="text-xs text-muted-foreground">
                {t('settings.orWriteTo', { defaultValue: 'Oder schreibe uns an' })}{' '}
                <span className="select-all">{SUPPORT_EMAIL}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          {step === 'request' ? (
            <Button variant="destructive" onClick={handleRequestCode} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.deleteRequestCode', { defaultValue: 'Code anfordern' })}
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleDelete} disabled={loading || !otp.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.deleteForever')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
