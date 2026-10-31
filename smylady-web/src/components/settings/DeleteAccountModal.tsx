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

interface DeleteAccountModalProps {
  open: boolean
  onClose: () => void
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { logout } = useAuth()
  const localePath = useLocalePath()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // 409 vom Lösch-Endpunkt: Ein Inhaber mit Team muss die Brand erst übertragen.
  // Die Meldung nennt die Inhaberschaft nur in diesem Fall, nicht bei offenen Aufträgen.
  const [showTeamLink, setShowTeamLink] = useState(false)
  const { role } = useBrandProfile()

  const CONFIRM_PHRASE = t('settings.deleteConfirmPhrase')

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast({
        variant: 'destructive',
        title: t('settings.confirmationRequired'),
        description: t('settings.typeToConfirm', { phrase: CONFIRM_PHRASE }),
      })
      return
    }

    setLoading(true)
    setDeleteError(null)
    setShowTeamLink(false)
    try {
      await authService.deleteAccount()
      toast({
        title: t('settings.accountDeleted'),
        description: t('settings.accountDeletedDesc'),
      })
      handleClose()
      // Logout and redirect
      logout()
    } catch (error: unknown) {
      const errorMessage = readBrandTeamError(error, t('errors.general'), t('common.rateLimited'))
      setDeleteError(errorMessage)
      setShowTeamLink(brandErrorStatus(error) === 409 && /inhaberschaft/i.test(errorMessage))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setLoading(false)
    setDeleteError(null)
    setShowTeamLink(false)
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmText">
              {t('settings.typePhrase')} <span className="font-bold text-destructive">{CONFIRM_PHRASE}</span>{' '}
              {t('settings.toConfirm', { defaultValue: 'zum Bestätigen' })}
            </Label>
            <Input
              id="confirmText"
              type="text"
              placeholder={CONFIRM_PHRASE}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              disabled={loading}
              className="uppercase"
            />
          </div>

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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== CONFIRM_PHRASE}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('settings.deleteForever')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
