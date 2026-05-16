'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Step = 'email' | 'otp' | 'password'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setStep('otp')
      toast({ title: t('auth.emailSent'), description: t('auth.checkInboxInstructions') })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('errors.tryAgain'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await authService.verifyOtp({ email, otp, type: 'forgot-password' })
      console.log('verifyOtp result:', result)
      setResetToken(result?.token || (result as any)?.resetToken || '')
      setStep('password')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || 'Ungültiger Code. Bitte erneut versuchen.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Passwörter stimmen nicht überein.' })
      return
    }
    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Passwort muss mindestens 8 Zeichen haben.' })
      return
    }
    setIsLoading(true)
    try {
      await authService.resetPassword({ email, password, token: resetToken })
      toast({ title: 'Passwort geändert', description: 'Du kannst dich jetzt einloggen.' })
      router.push('/login')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('errors.tryAgain'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      await authService.resendOtp({ email, type: 'forgot-password' })
      toast({ title: 'Code erneut gesendet', description: `Bitte prüfe ${email}.` })
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Code konnte nicht gesendet werden.' })
    }
  }

  const stepTitles: Record<Step, string> = {
    email: t('auth.forgotPassword'),
    otp: 'Code eingeben',
    password: 'Neues Passwort',
  }

  const stepDescriptions: Record<Step, string> = {
    email: t('auth.resetInstructions'),
    otp: `Wir haben einen Code an ${email} gesendet.`,
    password: 'Wähle ein neues Passwort für deinen Account.',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/logo.png"
            alt="Share Your Party"
            className="mx-auto w-16 h-16 rounded-full object-cover mb-4"
          />
          <CardTitle className="text-2xl gradient-text">{stepTitles[step]}</CardTitle>
          <CardDescription>{stepDescriptions[step]}</CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={isLoading}>
                {t('auth.sendLink')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Bestätigungscode</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={isLoading}>
                Code bestätigen
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-primary hover:underline font-medium"
                >
                  Code erneut senden
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Neues Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mindestens 8 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={isLoading}>
                Passwort speichern
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
