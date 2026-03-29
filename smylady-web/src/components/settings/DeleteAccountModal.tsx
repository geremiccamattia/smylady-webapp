import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
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
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

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
      const errorMessage = error instanceof Error ? error.message : t('errors.general')
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setLoading(false)
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
                <li>{t('settings.deleteInfo5')}</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmText">
              {t('settings.typePhrase')} <span className="font-bold text-destructive">{CONFIRM_PHRASE}</span> {t('settings.toConfirm')}
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
