'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { apiClient } from '@/services/api'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [otp, setOtp] = useState('')
  const { register, login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('auth.passwordsDoNotMatch', { defaultValue: 'Passwords do not match' }),
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('auth.passwordTooShort', { defaultValue: 'Password too short' }),
      })
      return
    }

    setIsLoading(true)

    try {
      await register(name, email, password, dateOfBirth)
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'sign_up', method: 'email' })
      setRegisteredEmail(email)
      setStep('verify')
      toast({
        title: t('auth.registerSuccess', { defaultValue: 'Registration successful!' }),
        description: t('auth.checkEmailOTP', { defaultValue: 'Please check your email for the verification code.' }),
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('auth.registerFailed', { defaultValue: 'Registration failed' }),
        description: error.response?.data?.message || t('common.retry', { defaultValue: 'Try again' }),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email: registeredEmail,
        otp,
        type: 'sign-up',
      })
      const data = response.data?.data
      if (data?.token) {
        await login({ token: data.token, user: {
          id: data.userId,
          email: data.email,
          role: data.role,
          name: '',
          username: '',
        } as any })
      }
      toast({
        title: t('auth.emailConfirmed', { defaultValue: 'Email confirmed!' }),
      })
      router.replace('/interests')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('auth.invalidCode', { defaultValue: 'Invalid code' }),
        description: error.response?.data?.message || t('common.retry', { defaultValue: 'Try again' }),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="relative w-full max-w-md">
        <CardHeader className="text-center">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img
            src="/logo.png"
            alt="Share Your Party"
            className="mx-auto w-16 h-16 rounded-full object-cover mb-4"
          />
          <CardTitle className="text-2xl gradient-text">{t('auth.createAccount', { defaultValue: 'Join now' })}</CardTitle>
          <CardDescription>
            {t('auth.registerSubtitle', { defaultValue: 'Discover and share the best events' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.verificationSent', { email: registeredEmail, defaultValue: `We have sent a verification code to ${registeredEmail}.` })}
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">{t('auth.verificationCode', { defaultValue: 'Verification code' })}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={isLoading}>
                {t('common.confirm', { defaultValue: 'Confirm' })}
              </Button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.name', { defaultValue: 'Name' })}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('auth.namePlaceholder', { defaultValue: 'John Doe' })}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email', { defaultValue: 'Email' })}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder', { defaultValue: 'your@email.com' })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">{t('auth.dateOfBirth', { defaultValue: 'Date of birth' })}</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password', { defaultValue: 'Password' })}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword', { defaultValue: 'Confirm password' })}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full" loading={isLoading}>
              {t('auth.register', { defaultValue: 'Join now' })}
            </Button>
          </form>
          )}

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('common.or', { defaultValue: 'or' })}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleLoginButton
                onSuccess={() => {
                  window.dataLayer = window.dataLayer || []
                  window.dataLayer.push({ event: 'sign_up', method: 'google' })
                  router.push('/explore')
                }}
                className="w-full"
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount', { defaultValue: 'Already have an account?' })}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('auth.loginNow', { defaultValue: 'Sign in now' })}
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t('auth.termsPrefix', { defaultValue: 'By registering you agree to our' })}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {t('auth.termsLink', { defaultValue: 'Terms & Conditions' })}
            </Link>{' '}
            {t('common.and', { defaultValue: 'and' })}{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              {t('auth.privacyLink', { defaultValue: 'Privacy Policy' })}
            </Link>
            {'.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
