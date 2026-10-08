'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, CheckCircle2, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import { useLocalePath } from '@/hooks/useLocalePath'
import { apiClient } from '@/services/api'
import { authService } from '@/services/auth'
import { useFingerprint } from '@/hooks/useFingerprint'

/*
 * Registrierung für Marken.
 *
 * Aufbau wie views/auth/Register.tsx, mit zwei zusätzlichen Schritten: Nach der
 * OTP-Bestätigung wird NICHT zu /interests weitergeleitet, sondern das
 * Markenprofil erfasst und anschließend ein Abschlussbildschirm gezeigt. Die
 * Nutzerregistrierung selbst bleibt unangetastet — hier läuft derselbe
 * authService.register(), nur ohne Referral-Code, der für Marken keinen Sinn
 * ergibt.
 */

type Step = 'register' | 'verify' | 'brand-profile' | 'done'

/** Der Wert ist zugleich der gespeicherte Text — Muster wie FOLLOWER_OPTIONS. */
export const BRAND_INDUSTRY_OPTIONS = [
  { value: 'Getränke', labelKey: 'brandRegister.industryBeverages' },
  { value: 'Food & Gastronomie', labelKey: 'brandRegister.industryFood' },
  { value: 'Mode & Accessoires', labelKey: 'brandRegister.industryFashion' },
  { value: 'Beauty & Kosmetik', labelKey: 'brandRegister.industryBeauty' },
  { value: 'Lifestyle', labelKey: 'brandRegister.industryLifestyle' },
  { value: 'Musik & Entertainment', labelKey: 'brandRegister.industryMusic' },
  { value: 'Tech & Gadgets', labelKey: 'brandRegister.industryTech' },
  { value: 'Reisen & Tourismus', labelKey: 'brandRegister.industryTravel' },
  { value: 'Sport & Fitness', labelKey: 'brandRegister.industrySport' },
  { value: 'Gesundheit & Wellness', labelKey: 'brandRegister.industryHealth' },
  { value: 'Finanzen & Versicherungen', labelKey: 'brandRegister.industryFinance' },
  { value: 'Automobil', labelKey: 'brandRegister.industryAutomotive' },
  { value: 'Handel & E-Commerce', labelKey: 'brandRegister.industryRetail' },
  { value: 'Veranstalter & Locations', labelKey: 'brandRegister.industryEvents' },
  { value: 'Sonstiges', labelKey: 'brandRegister.industryOther' },
]

/** Obergrenze von POST/PATCH /brands/me für `description`. */
const DESCRIPTION_MAX_LENGTH = 1000

/** Leere Optionalfelder gar nicht erst mitschicken — Muster wie referralCode in Register.tsx. */
function optional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export default function BrandRegister() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const fingerprint = useFingerprint()

  /*
   * `null`, bis der AuthContext fertig geladen hat.
   *
   * Vorher steht isAuthenticated auf false, obwohl ein Token im localStorage
   * liegen kann — ohne das Warten sähe ein eingeloggter Nutzer für einen
   * Wimpernschlag das Registrierungsformular.
   */
  const [step, setStep] = useState<Step | null>(null)

  useEffect(() => {
    if (authLoading) return
    /*
     * Nur den STARTSCHRITT festlegen, danach nie wieder eingreifen.
     *
     * Entscheidend für den 401-Fall: Der Response-Interceptor in services/api.ts
     * räumt bei einem abgelehnten Token localStorage leer, isAuthenticated
     * kippt dadurch auf false. Ohne `prev ?? …` würde dieser Effekt den Nutzer
     * aus 'brand-profile' zurück auf 'register' werfen und seine Eingaben
     * verwerfen — genau das soll laut Anforderung nicht passieren.
     */
    setStep(prev => prev ?? (isAuthenticated ? 'brand-profile' : 'register'))
  }, [authLoading, isAuthenticated])

  // Schritt 1: Konto
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  // Schritt 2: OTP
  const [otp, setOtp] = useState('')

  // Schritt 3: Markenprofil
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPosition, setContactPosition] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [otherSocial, setOtherSocial] = useState('')
  const [showSocial, setShowSocial] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Fehler aus einer API-Antwort als Toast.
   *
   * 429 bekommt eine eigene Meldung: Die API lässt drei Anfragen pro Sekunde zu,
   * und die rohe Fehlermeldung des Backends sagt einem Nutzer dazu nichts.
   */
  const showApiError = (error: any, fallbackTitle: string) => {
    const status = error?.response?.status

    if (status === 429) {
      toast({
        variant: 'destructive',
        title: fallbackTitle,
        description: t('brandRegister.rateLimited', {
          defaultValue: 'Zu viele Versuche, bitte kurz warten.',
        }),
      })
      return
    }

    toast({
      variant: 'destructive',
      title: fallbackTitle,
      description:
        error?.response?.data?.message || t('common.retry', { defaultValue: 'Try again' }),
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
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

    if (!isAdultConfirmed) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('brandRegister.adultConfirmRequired', {
          defaultValue: 'Bitte bestätige, dass du mindestens 18 Jahre alt und für das Unternehmen handlungsbefugt bist.',
        }),
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Volljährigkeit per Haken statt per Geburtsdatum — Register.tsx sendet weiter dateOfBirth.
      await authService.register({
        name,
        email,
        password,
        isAdultConfirmed: true,
        deviceFingerprint: fingerprint || undefined,
      })
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'sign_up', method: 'email' })
      setRegisteredEmail(email)
      // Die Kontakt-E-Mail ist meistens dieselbe — vorbelegen, überschreibbar.
      setContactEmail(prev => prev || email)
      setContactName(prev => prev || name)
      setStep('verify')
      toast({
        title: t('auth.registerSuccess', { defaultValue: 'Registration successful!' }),
        description: t('auth.checkEmailOTP', {
          defaultValue: 'Please check your email for the verification code.',
        }),
      })
    } catch (error: any) {
      showApiError(error, t('auth.registerFailed', { defaultValue: 'Registration failed' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email: registeredEmail,
        otp,
        type: 'sign-up',
      })
      const data = response.data?.data
      if (data?.token) {
        await login({
          token: data.token,
          user: {
            id: data.userId,
            email: data.email,
            role: data.role,
            name: '',
            username: '',
          } as any,
        })
      }
      toast({ title: t('auth.emailConfirmed', { defaultValue: 'Email confirmed!' }) })
      // Anders als in Register.tsx KEIN router.replace('/interests') — die
      // Marke soll hier bleiben und ihr Profil anlegen.
      setStep('brand-profile')
    } catch (error: any) {
      showApiError(error, t('auth.invalidCode', { defaultValue: 'Invalid code' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBrandProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    // Gleiche Prüfung wie beim E-Mail-Feld der Registrierung, nur zusätzlich
    // explizit: Das Feld trägt type="email", aber der Wert kann vorbelegt sein.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('brandRegister.invalidContactEmail', {
          defaultValue: 'Bitte gib eine gültige E-Mail-Adresse für die Ansprechperson an.',
        }),
      })
      return
    }

    const socialLinks = {
      instagram: optional(instagram),
      tiktok: optional(tiktok),
      other: optional(otherSocial),
    }
    const hasSocialLinks = Object.values(socialLinks).some(value => value !== undefined)

    setIsSubmitting(true)
    try {
      await apiClient.post('/brands/me', {
        companyName: companyName.trim(),
        contactPerson: {
          name: contactName.trim(),
          email: contactEmail.trim(),
          position: optional(contactPosition),
        },
        industry,
        description: optional(description),
        logoUrl: optional(logoUrl),
        website: optional(website),
        socialLinks: hasSocialLinks ? socialLinks : undefined,
      })
      setStep('done')
    } catch (error: any) {
      const status = error?.response?.status

      /*
       * 409 ist kein Fehler, sondern der Normalfall beim zweiten Anlauf: Das
       * Profil besteht bereits, etwa weil jemand die Seite neu geladen und sich
       * erneut angemeldet hat. Das Ziel ist erreicht — also weiter zum
       * Abschluss, statt einen Fehler zu zeigen, den niemand beheben kann.
       */
      if (status === 409) {
        setStep('done')
        return
      }

      /*
       * 401 zwischen Verifizierung und Absenden: Der Interceptor hat das Token
       * bereits verworfen. Der Schritt bleibt stehen und alle Eingaben
       * ebenfalls, damit nach erneuter Anmeldung nichts neu getippt werden muss.
       */
      if (status === 401) {
        toast({
          variant: 'destructive',
          title: t('common.error', { defaultValue: 'Error' }),
          description: t('brandRegister.sessionExpired', {
            defaultValue:
              'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an – deine Eingaben bleiben erhalten.',
          }),
        })
        return
      }

      showApiError(
        error,
        t('brandRegister.profileFailed', { defaultValue: 'Markenprofil konnte nicht angelegt werden' }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const headerTitle =
    step === 'brand-profile' || step === 'done'
      ? t('brandRegister.profileTitle', { defaultValue: 'Dein Markenprofil' })
      : t('brandRegister.title', { defaultValue: 'Als Marke registrieren' })

  const headerSubtitle =
    step === 'brand-profile'
      ? t('brandRegister.profileSubtitle', { defaultValue: 'Erzähl uns kurz, wer ihr seid.' })
      : t('brandRegister.subtitle', { defaultValue: 'In zwei Schritten zum Markenprofil' })

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
          <CardTitle className="text-2xl gradient-text">{headerTitle}</CardTitle>
          {step !== 'done' && <CardDescription>{headerSubtitle}</CardDescription>}
        </CardHeader>

        <CardContent>
          {/* Solange der AuthContext lädt, steht noch nicht fest, wo es losgeht. */}
          {step === null && (
            <div className="space-y-3">
              <div className="h-10 bg-muted animate-pulse rounded-md" />
              <div className="h-10 bg-muted animate-pulse rounded-md" />
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
          )}

          {step === 'register' && (
            <>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.name', { defaultValue: 'Name' })}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('auth.namePlaceholder', { defaultValue: 'John Doe' })}
                    value={name}
                    onChange={e => setName(e.target.value)}
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
                    onChange={e => setEmail(e.target.value)}
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
                      onChange={e => setPassword(e.target.value)}
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
                  <Label htmlFor="confirmPassword">
                    {t('auth.confirmPassword', { defaultValue: 'Confirm password' })}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {/*
                  * Bewusst ohne `required`: Die Prüfung läuft in handleRegister,
                  * damit die Meldung als Toast kommt wie bei den anderen Feldern.
                  */}
                <div className="flex items-start gap-2">
                  <input
                    id="isAdultConfirmed"
                    type="checkbox"
                    checked={isAdultConfirmed}
                    onChange={e => setIsAdultConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <Label htmlFor="isAdultConfirmed" className="text-sm font-normal leading-snug">
                    {t('brandRegister.adultConfirm', {
                      defaultValue: 'Ich bin mindestens 18 Jahre alt und befugt, für das Unternehmen zu handeln.',
                    })}
                  </Label>
                </div>
                <Button type="submit" variant="gradient" className="w-full" loading={isSubmitting}>
                  {t('auth.register', { defaultValue: 'Join now' })}
                </Button>
              </form>

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
                  {/*
                    * Anders als in Register.tsx führt der Erfolg NICHT nach
                    * /explore, sondern in den Profilschritt — sonst bräche der
                    * Markenflow genau hier ab.
                    */}
                  <GoogleLoginButton
                    onSuccess={async () => {
                      window.dataLayer = window.dataLayer || []
                      window.dataLayer.push({ event: 'sign_up', method: 'google' })
                      if (fingerprint) {
                        try {
                          await apiClient.patch('/auth/device-fingerprint', { fingerprint })
                        } catch {
                          // Nicht kritisch
                        }
                      }
                      setStep('brand-profile')
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {t('auth.hasAccount', { defaultValue: 'Already have an account?' })}{' '}
                <Link href={localePath('/login')} className="text-primary hover:underline font-medium">
                  {t('auth.loginNow', { defaultValue: 'Sign in now' })}
                </Link>
              </p>
            </>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.verificationSent', {
                  email: registeredEmail,
                  defaultValue: `We have sent a verification code to ${registeredEmail}.`,
                })}
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">
                  {t('auth.verificationCode', { defaultValue: 'Verification code' })}
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" loading={isSubmitting}>
                {t('common.confirm', { defaultValue: 'Confirm' })}
              </Button>
            </form>
          )}

          {step === 'brand-profile' && (
            <form onSubmit={handleBrandProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  {t('brandRegister.companyName', { defaultValue: 'Firmenname' })}
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder={t('brandRegister.companyNamePlaceholder', { defaultValue: 'Muster GmbH' })}
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">
                  {t('brandRegister.contactName', { defaultValue: 'Name der Ansprechperson' })}
                </Label>
                <Input
                  id="contactName"
                  type="text"
                  placeholder={t('brandRegister.contactNamePlaceholder', { defaultValue: 'Maria Muster' })}
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  {t('brandRegister.contactEmail', { defaultValue: 'E-Mail der Ansprechperson' })}
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder={t('auth.emailPlaceholder', { defaultValue: 'your@email.com' })}
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPosition">
                  {t('brandRegister.contactPosition', { defaultValue: 'Position' })}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({t('common.optional', { defaultValue: 'optional' })})
                  </span>
                </Label>
                <Input
                  id="contactPosition"
                  type="text"
                  placeholder={t('brandRegister.contactPositionPlaceholder', {
                    defaultValue: 'Marketing Managerin',
                  })}
                  value={contactPosition}
                  onChange={e => setContactPosition(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t('brandRegister.industry', { defaultValue: 'Branche' })}
                </Label>
                <select
                  id="industry"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">
                    {t('brandRegister.industryPlaceholder', { defaultValue: 'Bitte wählen' })}
                  </option>
                  {BRAND_INDUSTRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey, { defaultValue: option.value })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('brandRegister.description', { defaultValue: 'Über euch' })}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({t('common.optional', { defaultValue: 'optional' })})
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('brandRegister.descriptionPlaceholder', {
                    defaultValue:
                      'Was macht eure Marke aus? Welche Produkte oder Events sind für Creator interessant?',
                  })}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">
                  {t('brandRegister.logoUrl', { defaultValue: 'Logo-URL' })}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({t('common.optional', { defaultValue: 'optional' })})
                  </span>
                </Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  {t('brandRegister.website', { defaultValue: 'Website' })}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({t('common.optional', { defaultValue: 'optional' })})
                  </span>
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://..."
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              {/* Optionale Profile gebündelt, damit das Formular nicht ausufert. */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSocial(o => !o)}
                  aria-expanded={showSocial}
                  className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>
                    {t('brandRegister.socialLinks', { defaultValue: 'Social Media' })}
                    <span className="text-xs ml-1">
                      ({t('common.optional', { defaultValue: 'optional' })})
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showSocial ? 'rotate-180' : ''}`}
                  />
                </button>

                {showSocial && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        type="text"
                        placeholder="@marke"
                        value={instagram}
                        onChange={e => setInstagram(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        type="text"
                        placeholder="@marke"
                        value={tiktok}
                        onChange={e => setTiktok(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherSocial">
                        {t('brandRegister.socialOther', { defaultValue: 'Weiteres Profil' })}
                      </Label>
                      <Input
                        id="otherSocial"
                        type="text"
                        placeholder="https://..."
                        value={otherSocial}
                        onChange={e => setOtherSocial(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" variant="gradient" className="w-full" loading={isSubmitting}>
                {t('brandRegister.submitProfile', { defaultValue: 'Markenprofil anlegen' })}
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <p className="font-medium">
                {t('brandRegister.doneTitle', {
                  defaultValue: 'Danke, dein Markenprofil wurde angelegt.',
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('brandRegister.doneDescription', {
                  defaultValue: 'Wir prüfen deine Angaben und schalten dich zeitnah frei.',
                })}
              </p>
              {/* Kein automatischer Redirect — der Hinweis soll gelesen werden können. */}
              <Link href={localePath('/explore')} className="block">
                <Button variant="gradient" className="w-full">
                  {t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
