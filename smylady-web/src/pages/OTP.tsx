import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

const OTP_LENGTH = 6

export default function OTP() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const type = searchParams.get('type') || 'signup' // 'signup' or 'forgot_password'
  const email = sessionStorage.getItem('otp_email') || ''

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const verifyOtpMutation = useMutation({
    mutationFn: () =>
      authService.verifyOtp({
        email,
        otp: otp.join(''),
        type: type === 'forgot_password' ? 'forgot_password' : 'signup',
      }),
    onSuccess: async (data) => {
      if (type === 'forgot_password') {
        // Store token for password reset
        sessionStorage.setItem('reset_email', email)
        sessionStorage.setItem('reset_token', data.resetToken || '')
        sessionStorage.removeItem('otp_email')
        navigate('/change-password')
      } else {
        // Login user after signup verification
        sessionStorage.removeItem('otp_email')
        // For signup OTP, data may have user object or individual fields
        const userId = data.user?._id || data.user?.id || data.userId || ''
        const userEmail = data.user?.email || data.email || email
        const userRole = data.user?.role || data.role || 'user'
        const userName = data.user?.name || ''
        const userUsername = data.user?.username || ''

        await login({
          token: data.token,
          user: {
            _id: userId,
            id: userId,
            email: userEmail,
            name: userName,
            username: userUsername,
            role: userRole as 'user' | 'organizer',
          },
        })
        // Invalidate all cached queries so they refetch with auth token
        await queryClient.invalidateQueries()
        toast({
          description: t('otp.success', {
            defaultValue: 'Verifizierung erfolgreich!',
          }),
        })
        navigate('/explore')
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('auth.invalidCode'),
      })
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    },
  })

  const resendOtpMutation = useMutation({
    mutationFn: () =>
      authService.resendOtp({
        email,
        type: type === 'forgot_password' ? 'forgot_password' : 'signup',
      }),
    onSuccess: () => {
      toast({
        description: t('otp.resent', {
          defaultValue: 'Code wurde erneut gesendet',
        }),
      })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('auth.codeSendError'),
      })
    },
  })

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered
    if (value && index === OTP_LENGTH - 1 && newOtp.every((digit) => digit)) {
      verifyOtpMutation.mutate()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, OTP_LENGTH)
    const digits = pastedData.split('').filter((char) => /^\d$/.test(char))

    if (digits.length > 0) {
      const newOtp = [...otp]
      digits.forEach((digit, index) => {
        if (index < OTP_LENGTH) {
          newOtp[index] = digit
        }
      })
      setOtp(newOtp)

      // Focus last filled input or next empty one
      const lastIndex = Math.min(digits.length, OTP_LENGTH) - 1
      inputRefs.current[lastIndex]?.focus()

      // Auto-submit if complete
      if (newOtp.every((digit) => digit)) {
        setTimeout(() => verifyOtpMutation.mutate(), 100)
      }
    }
  }

  const isComplete = otp.every((digit) => digit)

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
            {t('otp.heading', { defaultValue: 'Code eingeben' })}
          </CardTitle>
          <CardDescription>
            {t('otp.description', {
              defaultValue: 'Wir haben dir einen 6-stelligen Code per E-Mail geschickt',
            })}
          </CardDescription>
          {email && (
            <p className="text-sm text-muted-foreground mt-2">
              {t('otp.sentTo', { defaultValue: 'Gesendet an' })}: <strong>{email}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* OTP Input Fields */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold"
                  disabled={verifyOtpMutation.isPending}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              className="w-full bg-pink-500 hover:bg-pink-600"
              onClick={() => verifyOtpMutation.mutate()}
              disabled={!isComplete || verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('otp.verifying', { defaultValue: 'Wird verifiziert...' })}
                </>
              ) : (
                t('otp.button', { defaultValue: 'Verifizieren' })
              )}
            </Button>

            {/* Resend Link */}
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => resendOtpMutation.mutate()}
                disabled={resendOtpMutation.isPending}
                className="text-pink-500"
              >
                {resendOtpMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('otp.resending', { defaultValue: 'Wird gesendet...' })}
                  </>
                ) : (
                  t('otp.resendBtn', { defaultValue: 'Code erneut senden' })
                )}
              </Button>
            </div>

            {/* Back Link */}
            <div className="text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
