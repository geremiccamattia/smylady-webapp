import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { userSettingsService } from '@/services/userSettings'
import { Loader2, Mail, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ChangeEmailModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  currentEmail?: string
}

type Step = 'email' | 'otp'

export function ChangeEmailModal({ open, onClose, onSuccess, currentEmail }: ChangeEmailModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('email')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        variant: 'destructive',
        title: t('auth.invalidEmail'),
        description: t('auth.enterValidEmail'),
      })
      return
    }

    if (newEmail === currentEmail) {
      toast({
        variant: 'destructive',
        title: t('settings.sameEmail'),
        description: t('settings.newEmailMustDiffer'),
      })
      return
    }

    setLoading(true)
    try {
      await userSettingsService.requestEmailChange(newEmail)
      toast({
        title: t('auth.codeSent'),
        description: t('auth.confirmationCodeSentTo', { email: newEmail }),
      })
      setStep('otp')
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

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({
        variant: 'destructive',
        title: t('auth.invalidCode'),
        description: t('auth.enterFullCode'),
      })
      return
    }

    setLoading(true)
    try {
      await userSettingsService.verifyEmailChange(newEmail, otp)
      toast({
        title: t('settings.emailChanged'),
        description: t('settings.emailChangedDesc'),
      })
      handleClose()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('auth.invalidCode')
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
    setStep('email')
    setNewEmail('')
    setOtp('')
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('settings.changeEmail')}
          </DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? t('settings.enterNewEmailDesc')
              : t('auth.enterCodeSentTo', { email: newEmail })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'email' ? (
            <>
              {currentEmail && (
                <div>
                  <Label className="text-muted-foreground text-sm">{t('settings.currentEmail')}</Label>
                  <p className="text-sm font-medium">{currentEmail}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newEmail">{t('settings.newEmail')}</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder={t('settings.newEmailPlaceholder')}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {t('auth.confirmationCode')}
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          {step === 'email' ? (
            <Button onClick={handleRequestChange} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.sendCode')}
            </Button>
          ) : (
            <Button onClick={handleVerifyOtp} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
