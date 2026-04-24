import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/explore'
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Die Passwörter stimmen nicht überein.',
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
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
        title: 'Registrierung erfolgreich!',
        description: 'Bitte überprüfe deine E-Mail für den Bestätigungscode.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registrierung fehlgeschlagen',
        description: error.response?.data?.message || 'Bitte versuche es erneut.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await apiClient.post('/auth/verify-otp', {
        email: registeredEmail,
        otp,
        type: 'sign-up',
      })
      toast({ title: 'E-Mail bestätigt!', description: 'Du kannst dich jetzt anmelden.' })
      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ungültiger Code',
        description: error.response?.data?.message || 'Bitte versuche es erneut.',
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
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img
            src="/logo.png" 
            alt="Share Your Party" 
            className="mx-auto w-16 h-16 rounded-full object-cover mb-4"
          />
          <CardTitle className="text-2xl gradient-text">Account erstellen</CardTitle>
          <CardDescription>
            Registriere dich um Events zu entdecken und zu teilen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Wir haben einen Bestätigungscode an {registeredEmail} gesendet.
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">Bestätigungscode</Label>
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
                Bestätigen
              </Button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Geburtsdatum</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
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
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
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
              Registrieren
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
                  Oder
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleLoginButton
                onSuccess={() => {
                  window.dataLayer = window.dataLayer || []
                  window.dataLayer.push({ event: 'sign_up', method: 'google' })
                  navigate('/explore')
                }}
                className="w-full"
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bereits ein Konto?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Jetzt anmelden
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Mit der Registrierung stimmst du unseren{' '}
            <Link to="/terms" className="text-primary hover:underline">
              AGB
            </Link>{' '}
            und{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Datenschutzrichtlinien
            </Link>{' '}
            zu.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
