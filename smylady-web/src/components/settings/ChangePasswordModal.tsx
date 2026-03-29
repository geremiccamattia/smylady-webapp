import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { userSettingsService } from '@/services/userSettings'
import { Loader2, Lock, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'current' | 'otp' | 'new'

export function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('current')
  const [currentPassword, setCurrentPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleRequestChange = async () => {
    if (!currentPassword) {
      toast({
        variant: 'destructive',
        title: t('auth.passwordRequired'),
        description: t('auth.enterCurrentPassword'),
      })
      return
    }

    setLoading(true)
    try {
      await userSettingsService.requestPasswordChange(currentPassword)
      toast({
        title: t('auth.codeSent'),
        description: t('auth.confirmationCodeSent'),
      })
      setStep('otp')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('auth.wrongPassword')
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) {
      toast({
        variant: 'destructive',
        title: t('auth.invalidCode'),
        description: t('auth.enterFullCode'),
      })
      return
    }
    setStep('new')
  }

  const handleSetNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: t('auth.passwordTooShort'),
        description: t('auth.passwordMinLength'),
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('auth.passwordsDoNotMatch'),
        description: t('auth.ensurePasswordsIdentical'),
      })
      return
    }

    setLoading(true)
    try {
      await userSettingsService.verifyPasswordChange(newPassword, otp)
      toast({
        title: t('auth.passwordChanged'),
        description: t('auth.passwordChangedDesc'),
      })
      handleClose()
      onSuccess?.()
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
    setStep('current')
    setCurrentPassword('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    onClose()
  }

  const renderContent = () => {
    switch (step) {
      case 'current':
        return (
          <>
            <DialogDescription>
              {t('auth.enterCurrentDesc')}
            </DialogDescription>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('auth.currentPassword')}</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleRequestChange} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.next')}
              </Button>
            </div>
          </>
        )

      case 'otp':
        return (
          <>
            <DialogDescription>
              {t('auth.enterCodeSentToEmail')}
            </DialogDescription>
            <div className="space-y-4 py-4">
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleVerifyOtp} disabled={loading}>
                {t('common.next')}
              </Button>
            </div>
          </>
        )

      case 'new':
        return (
          <>
            <DialogDescription>
              {t('auth.setNewPasswordDesc')}
            </DialogDescription>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSetNewPassword} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.changePassword')}
              </Button>
            </div>
          </>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('auth.changePassword')}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
