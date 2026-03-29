import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSuccess(true)
      toast({
        title: t('auth.emailSent'),
        description: t('auth.checkInboxInstructions'),
      })
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="/logo.png" 
            alt="Share Your Party" 
            className="mx-auto w-16 h-16 rounded-full object-cover mb-4"
          />
          <CardTitle className="text-2xl gradient-text">{t('auth.forgotPassword')}</CardTitle>
          <CardDescription>
            {t('auth.resetInstructions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-700 dark:text-green-300">
                  {t('auth.emailSentTo', { email })} <strong>{email}</strong>.
                  {t('auth.checkInbox')}
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
            </form>
          )}

          {!isSuccess && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                {t('auth.backToLogin')}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
