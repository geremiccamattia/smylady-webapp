import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { ChevronLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/auth'
import { useToast } from '@/hooks/use-toast'

interface ChangePasswordForm {
  newPassword: string
  confirmPassword: string
}

export default function ChangePassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>()

  const newPassword = watch('newPassword')

  // Get email and token from sessionStorage (set during forgot password flow)
  const email = sessionStorage.getItem('reset_email') || ''
  const token = sessionStorage.getItem('reset_token') || ''

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { password: string }) =>
      authService.resetPassword({ email, password: data.password, token }),
    onSuccess: () => {
      toast({
        description: t('auth.passwordChanged'),
      })
      // Clear session storage
      sessionStorage.removeItem('reset_email')
      sessionStorage.removeItem('reset_token')
      navigate('/login')
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('auth.passwordChangeError'),
      })
    },
  })

  const onSubmit = (data: ChangePasswordForm) => {
    resetPasswordMutation.mutate({ password: data.newPassword })
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
            <Lock className="h-6 w-6 text-pink-500" />
          </div>
          <CardTitle className="text-2xl">
            {t('auth.newPassword')}
          </CardTitle>
          <CardDescription>
            {t('auth.enterNewPassword')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t('auth.newPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="********"
                  {...register('newPassword', {
                    required: t('validation.required', { defaultValue: 'Pflichtfeld' }),
                    minLength: {
                      value: 8,
                      message: t('validation.minLength', {
                        defaultValue: 'Mindestens 8 Zeichen',
                        count: 8,
                      }),
                    },
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('auth.confirmPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="********"
                  {...register('confirmPassword', {
                    required: t('validation.required', { defaultValue: 'Pflichtfeld' }),
                    validate: (value) =>
                      value === newPassword ||
                      t('validation.passwordMismatch', {
                        defaultValue: 'Passwörter stimmen nicht überein',
                      }),
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('changePassword.changing', { defaultValue: 'Wird geändert...' })}
                </>
              ) : (
                t('changePassword.submitButton', { defaultValue: 'Passwort ändern' })
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
