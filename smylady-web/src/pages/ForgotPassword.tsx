import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { ChevronLeft, Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/auth'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = useState('')

  const forgotPasswordMutation = useMutation({
    mutationFn: () => authService.forgotPassword(email),
    onSuccess: () => {
      toast({
        description: t('forgotPassword.success', {
          defaultValue: 'Code wurde an deine E-Mail gesendet',
        }),
      })
      // Store email for OTP page
      sessionStorage.setItem('otp_email', email)
      navigate('/otp?type=forgot_password')
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('forgotPassword.error', {
          defaultValue: 'E-Mail nicht gefunden',
        }),
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      forgotPasswordMutation.mutate()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link to="/login">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Mail className="h-6 w-6 text-pink-500" />
          </div>
          <CardTitle className="text-2xl">
            {t('auth.forgotPassword')}
          </CardTitle>
          <CardDescription>
            {t('auth.resetInstructions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600"
              disabled={!email.trim() || forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('forgotPassword.sending', { defaultValue: 'Wird gesendet...' })}
                </>
              ) : (
                t('auth.sendCode')
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-pink-500 hover:underline"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
