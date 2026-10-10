'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Check, Ghost, Globe, Instagram, Music2, Plus, Sparkles, User, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { apiClient } from '@/services/api'
import { cn } from '@/lib/utils'

/*
 * Creator-Bewerbung als eigenständige Komponente.
 *
 * Herausgelöst aus views/CreatorClubPage.tsx, wo dasselbe Formular bis zuletzt
 * eingebettet war. Es wird jetzt an zwei Stellen gebraucht — im Zusatzschritt
 * der Registrierung und auf /creator/apply —, und zwei Kopien wären eine
 * sichere Quelle für auseinanderlaufende Validierung und Payloads.
 *
 * Gegenüber der eingebetteten Fassung entfällt die Abfrage von Name und
 * E-Mail: Beides steht im Konto. Das Backend erwartet im Payload weiterhin
 * firstName und lastName, die deshalb aus dem Kontonamen abgeleitet und
 * überschreibbar angezeigt werden.
 */

const GRADIENT = 'bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]'

interface OtherChannel {
  platform: string
  username: string
}

interface FormState {
  firstName: string
  lastName: string
  city: string
  age: string
  instagram: string
  tiktok: string
  snapchat: string
  otherChannels: OtherChannel[]
  followerRange: string
  categories: string[]
}

export const FOLLOWER_OPTIONS = [
  { value: 'Unter 1.500', labelKey: 'influencer.followersUnder1500' },
  { value: '1.500–5.000', labelKey: 'influencer.followers1500to5000' },
  { value: '5.001–10.000', labelKey: 'influencer.followers5001to10000' },
  { value: '10.001–25.000', labelKey: 'influencer.followers10001to25000' },
  { value: '25.001–50.000', labelKey: 'influencer.followers25001to50000' },
  { value: '50.001–100.000', labelKey: 'influencer.followers50001to100000' },
  { value: 'Über 100.000', labelKey: 'influencer.followersOver100000' },
]

export const CATEGORY_OPTIONS = [
  { value: 'Nightlife', labelKey: 'influencer.categoryNightlife' },
  { value: 'Lifestyle', labelKey: 'influencer.categoryLifestyle' },
  { value: 'Fashion', labelKey: 'influencer.categoryFashion' },
  { value: 'Food & Drinks', labelKey: 'influencer.categoryFoodDrinks' },
  { value: 'Travel', labelKey: 'influencer.categoryTravel' },
  { value: 'Business', labelKey: 'influencer.categoryBusiness' },
  { value: 'Musik', labelKey: 'influencer.categoryMusic' },
  { value: 'Fitness', labelKey: 'influencer.categoryFitness' },
  { value: 'Kunst & Kultur', labelKey: 'influencer.categoryArtCulture' },
  { value: 'Student Life', labelKey: 'influencer.categoryStudentLife' },
]

export const OTHER_PLATFORMS = [
  { value: 'YouTube', labelKey: 'influencer.platformYoutube' },
  { value: 'Twitch', labelKey: 'influencer.platformTwitch' },
  { value: 'Pinterest', labelKey: 'influencer.platformPinterest' },
  { value: 'Facebook', labelKey: 'influencer.platformFacebook' },
  { value: 'LinkedIn', labelKey: 'influencer.platformLinkedin' },
  { value: 'X', labelKey: 'influencer.platformX' },
  { value: 'Threads', labelKey: 'influencer.platformThreads' },
  { value: 'Website', labelKey: 'influencer.platformWebsite' },
  { value: 'Sonstiges', labelKey: 'influencer.platformOther' },
]

const STEP_KEYS = [
  'influencer.step0Label',
  'influencer.step1Label',
  'influencer.step2Label',
  'influencer.step3Label',
]

/**
 * Alter aus dem Geburtsdatum des Kontos.
 *
 * `null`, wenn kein oder ein unbrauchbares Datum hinterlegt ist — dann fragt
 * das Formular das Alter wie bisher ab. Ein geschätztes Alter wäre schlechter
 * als eine Frage, weil das Backend auf mindestens 18 prüft.
 */
export function ageFromDateOfBirth(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  // Geburtstag dieses Jahr noch nicht erreicht.
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1

  return age >= 0 && age < 130 ? age : null
}

/**
 * Kontoname in Vor- und Nachname zerlegt.
 *
 * Alles vor dem ersten Leerzeichen ist der Vorname, der Rest der Nachname. Bei
 * einteiligen Namen bleibt der Nachname leer — deshalb bleiben beide Felder
 * sichtbar und überschreibbar, statt den Split stillschweigend zu übernehmen.
 */
export function splitFullName(fullName?: string | null): { firstName: string; lastName: string } {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/** Fehlertext aus beiden Antwortformaten des Backends. */
function apiMessage(error: unknown): string | undefined {
  const response = (error as { response?: { data?: { message?: string; msg?: string } } })?.response
  return response?.data?.message || response?.data?.msg
}

interface CreatorApplicationFormProps {
  /** Nach erfolgreichem Absenden — und nach 409, weil das Ziel dann erreicht ist. */
  onSubmitted: () => void
  /** Optionaler Ausstieg, im Registrierungsflow „Später bewerben". */
  onSkip?: () => void
  skipLabel?: string
  /**
   * Geburtsdatum aus dem aufrufenden Formular.
   *
   * Hat Vorrang vor dem Kontext: In der Registrierung steht der Wert im
   * Formularzustand, während das Nutzerobjekt aus GET /users/me kommt — und
   * dort fehlt das Feld. Ohne diese Prop fragte der Creator-Schritt direkt
   * nach dem Geburtsdatum noch einmal nach dem Alter.
   */
  dateOfBirth?: string | null
}

export default function CreatorApplicationForm({
  onSubmitted,
  onSkip,
  skipLabel,
  dateOfBirth,
}: CreatorApplicationFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const { user } = useAuth()

  /*
   * Alter aus dem Geburtsdatum, nicht abgefragt.
   *
   * Reihenfolge: Prop vor Kontext. `null`, wenn beides fehlt oder unbrauchbar
   * ist — dann erscheint das Altersfeld wie bisher.
   */
  const accountAge = useMemo(
    () => ageFromDateOfBirth(dateOfBirth) ?? ageFromDateOfBirth(user?.dateOfBirth),
    [dateOfBirth, user?.dateOfBirth],
  )
  const nameParts = useMemo(() => splitFullName(user?.name), [user?.name])

  /*
   * Zu jung: Das Alter steht fest und lässt sich nicht einfach hochsetzen, wie
   * es im freien Altersfeld möglich wäre. Das Backend lehnt ohnehin ab, aber
   * erst nach dem Ausfüllen aller vier Schritte — der Hinweis gehört an den
   * Anfang.
   */
  const isUnderage = accountAge !== null && accountAge < 18

  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    city: 'Wien',
    age: accountAge !== null ? String(accountAge) : '',
    instagram: '',
    tiktok: '',
    snapchat: '',
    otherChannels: [],
    followerRange: '',
    categories: [],
  })
  const [consent, setConsent] = useState(false)
  const [stepError, setStepError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (value: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter(c => c !== value)
        : [...prev.categories, value],
    }))
  }

  const addChannel = () => {
    setForm(prev => ({
      ...prev,
      otherChannels: [...prev.otherChannels, { platform: OTHER_PLATFORMS[0].value, username: '' }],
    }))
  }

  const removeChannel = (index: number) => {
    setForm(prev => ({
      ...prev,
      otherChannels: prev.otherChannels.filter((_, i) => i !== index),
    }))
  }

  const updateChannel = (index: number, field: keyof OtherChannel, value: string) => {
    setForm(prev => ({
      ...prev,
      otherChannels: prev.otherChannels.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }))
  }

  const validateStep = (step: number): string => {
    if (step === 0) {
      const age = parseInt(form.age, 10)
      if (!form.firstName.trim() || !form.lastName.trim() || !form.city.trim()) {
        return t('influencer.validationRequired', { defaultValue: 'Bitte fülle alle Pflichtfelder aus.' })
      }
      // Die E-Mail-Prüfung entfällt: Die Adresse kommt aus dem bestätigten Konto.
      if (!age || age < 18) {
        return t('influencer.ageRequired', { defaultValue: 'Du musst mindestens 18 Jahre alt sein.' })
      }
      return ''
    }
    if (step === 1) {
      if (!form.instagram.trim() || !form.followerRange) {
        return t('influencer.validationRequired', { defaultValue: 'Bitte fülle alle Pflichtfelder aus.' })
      }
      return ''
    }
    if (step === 2) {
      if (form.categories.length === 0) {
        return t('influencer.categoriesError', { defaultValue: 'Bitte wähle mindestens eine Kategorie.' })
      }
      return ''
    }
    if (step === 3) {
      if (!consent) {
        return t('influencer.consentRequired', { defaultValue: 'Bitte akzeptiere die Datenschutzerklärung.' })
      }
      return ''
    }
    return ''
  }

  const goToStep = (index: number) => {
    if (index <= currentStep) {
      setStepError('')
      setCurrentStep(index)
      return
    }
    const error = validateStep(currentStep)
    if (error) {
      setStepError(error)
      return
    }
    setStepError('')
    setCurrentStep(index)
  }

  const handleNext = () => {
    const error = validateStep(currentStep)
    if (error) {
      setStepError(error)
      return
    }
    setStepError('')
    setCurrentStep(prev => Math.min(prev + 1, STEP_KEYS.length - 1))
  }

  const handleBack = () => {
    setStepError('')
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    for (let step = 0; step <= 3; step++) {
      const error = validateStep(step)
      if (error) {
        setCurrentStep(step)
        setStepError(error)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await apiClient.post('/influencer/apply', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        // Eingeloggt nimmt das Backend die Adresse aus dem Token; mitgeschickt
        // wird sie trotzdem, damit der Endpunkt anonym unverändert bleibt.
        email: user?.email ?? '',
        city: form.city.trim(),
        age: parseInt(form.age, 10),
        instagram: form.instagram.trim(),
        tiktok: form.tiktok.trim() || undefined,
        snapchat: form.snapchat.trim() || undefined,
        otherChannels: form.otherChannels
          .filter(c => c.username.trim())
          .map(c => ({ platform: c.platform, username: c.username.trim() })),
        followerRange: form.followerRange,
        categories: form.categories,
      })
      onSubmitted()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status

      /*
       * 409: Für das Konto liegt bereits eine Bewerbung oder ein Creator-Profil
       * vor. Kein Fehler, den jemand beheben könnte — der Hinweis genügt, und
       * die aufrufende Seite wechselt in die Statusansicht.
       */
      if (status === 409) {
        toast({
          title: t('influencer.alreadyApplied', {
            defaultValue: 'Für dein Konto liegt bereits eine Bewerbung vor.',
          }),
        })
        onSubmitted()
        return
      }

      /*
       * 401: Token abgelaufen. Eingaben bleiben stehen, damit nach erneuter
       * Anmeldung nichts neu getippt werden muss — gleiches Muster wie in
       * views/auth/BrandRegister.tsx.
       */
      if (status === 401) {
        toast({
          variant: 'destructive',
          title: t('common.error', { defaultValue: 'Fehler' }),
          description: t('brandRegister.sessionExpired', {
            defaultValue:
              'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an – deine Eingaben bleiben erhalten.',
          }),
        })
        return
      }

      if (status === 429) {
        toast({
          variant: 'destructive',
          title: t('common.error', { defaultValue: 'Fehler' }),
          description: t('brandRegister.rateLimited', {
            defaultValue: 'Zu viele Versuche, bitte kurz warten.',
          }),
        })
        return
      }

      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description:
          apiMessage(err) ||
          t('influencer.errorGeneric', {
            defaultValue: 'Bewerbung konnte nicht gesendet werden. Bitte versuche es erneut.',
          }),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepIcons = [User, Instagram, Sparkles, Check]

  /*
   * Unter 18: gar kein Formular.
   *
   * Statt das Altersfeld anzubieten, das sich einfach hochsetzen ließe, endet
   * der Weg hier. In der Registrierung führt der optionale Ausstieg (onSkip)
   * weiter; auf /creator/apply gibt es den nicht, dort führt ein Link zurück
   * in die Eventsuche, damit die Seite keine Sackgasse ist.
   */
  if (isUnderage) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-lg font-bold mb-2">
          {t('influencer.underageTitle', { defaultValue: 'Der Creator Club ist ab 18 Jahren.' })}
        </h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
          {t('influencer.underageDesc', {
            defaultValue:
              'Schau gern wieder vorbei, sobald du 18 bist. Share Your Party kannst du natürlich weiter nutzen.',
          })}
        </p>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            {skipLabel || t('common.continue', { defaultValue: 'Weiter' })}
          </button>
        ) : (
          <Link
            href={localePath('/explore')}
            className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            {t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Schrittnavigation */}
      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-4 border-b border-border">
        {STEP_KEYS.map((key, index) => {
          const StepIcon = stepIcons[index]
          const isActive = index === currentStep
          return (
            <div key={key} className="flex items-center gap-3 md:gap-4 shrink-0">
              <button
                type="button"
                onClick={() => goToStep(index)}
                className={cn(
                  'flex items-center gap-2 text-[11px] font-medium whitespace-nowrap',
                  isActive ? 'text-[#e9548c]' : 'text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center w-9 h-9 md:w-10 md:h-10 rounded-full border',
                    isActive ? 'border-[#e9548c]' : 'border-current'
                  )}
                >
                  <StepIcon className="h-4 w-4" />
                </span>
                <b className="font-bold">{t(key, { defaultValue: key })}</b>
              </button>
              {index < STEP_KEYS.length - 1 && <span className="text-muted-foreground/40">→</span>}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="pt-6 influencer-form">
        {currentStep === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/*
              * Name und E-Mail stehen im Konto. Vor- und Nachname bleiben
              * sichtbar, weil der Split aus einem einzelnen Namensfeld nicht
              * immer passt — etwa bei Doppelnamen oder einteiligen Namen.
              */}
            <div className="space-y-1.5">
              <Label htmlFor="firstName">{t('influencer.firstName', { defaultValue: 'Vorname' })} *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={e => updateField('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">{t('influencer.lastName', { defaultValue: 'Nachname' })} *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={e => updateField('lastName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t('influencer.city', { defaultValue: 'Wohnort' })} *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
                required
              />
            </div>

            {/* Nur abfragen, wenn das Konto kein Geburtsdatum trägt. */}
            {accountAge === null && (
              <div className="space-y-1.5">
                <Label htmlFor="age">{t('influencer.age', { defaultValue: 'Alter' })} *</Label>
                <Input
                  id="age"
                  type="number"
                  min={18}
                  value={form.age}
                  onChange={e => updateField('age', e.target.value)}
                  placeholder={t('influencer.agePlaceholder', { defaultValue: 'z. B. 25' })}
                  className="max-w-[140px]"
                  required
                />
              </div>
            )}

            <p className="md:col-span-2 text-xs text-muted-foreground">
              {t('influencer.accountDataHint', {
                email: user?.email ?? '',
                defaultValue: `Wir verwenden die E-Mail-Adresse deines Kontos (${user?.email ?? ''}).`,
              })}
            </p>
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-[#ff1684]" />
                  {t('influencer.instagram', { defaultValue: 'Instagram' })} *
                </Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={e => updateField('instagram', e.target.value)}
                  placeholder={t('influencer.instagramHint', { defaultValue: '@deinprofil' })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tiktok" className="flex items-center gap-2">
                  <Music2 className="h-4 w-4" />
                  {t('influencer.tiktok', { defaultValue: 'TikTok' })}{' '}
                  <em className="font-normal text-muted-foreground not-italic">
                    {t('influencer.optionalLabel', { defaultValue: '(optional)' })}
                  </em>
                </Label>
                <Input
                  id="tiktok"
                  value={form.tiktok}
                  onChange={e => updateField('tiktok', e.target.value)}
                  placeholder={t('influencer.tiktokHint', { defaultValue: '@deinprofil' })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="snapchat" className="flex items-center gap-2">
                  <Ghost className="h-4 w-4" />
                  {t('influencer.snapchat', { defaultValue: 'Snapchat' })}{' '}
                  <em className="font-normal text-muted-foreground not-italic">
                    {t('influencer.optionalLabel', { defaultValue: '(optional)' })}
                  </em>
                </Label>
                <Input
                  id="snapchat"
                  value={form.snapchat}
                  onChange={e => updateField('snapchat', e.target.value)}
                  placeholder={t('influencer.snapchatHint', { defaultValue: '@deinprofil' })}
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={addChannel}
                  className="w-full flex items-center gap-3 rounded-lg border border-input px-3 py-2.5 text-left hover:border-[#e9548c] transition-colors"
                >
                  <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-xs">
                    <b className="block font-bold">
                      {t('influencer.addChannel', { defaultValue: 'Sonstige Kanäle hinzufügen' })}{' '}
                      <em className="font-normal text-muted-foreground not-italic">
                        {t('influencer.optionalLabel', { defaultValue: '(optional)' })}
                      </em>
                    </b>
                    <span className="text-muted-foreground">
                      {t('influencer.addChannelHint', { defaultValue: 'Weitere Plattformen hinzufügen' })}
                    </span>
                  </span>
                  <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>

                {form.otherChannels.map((channel, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select
                      value={channel.platform}
                      onChange={e => updateChannel(index, 'platform', e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {OTHER_PLATFORMS.map(platform => (
                        <option key={platform.value} value={platform.value}>
                          {t(platform.labelKey, { defaultValue: platform.value })}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={channel.username}
                      onChange={e => updateChannel(index, 'username', e.target.value)}
                      placeholder={t('influencer.usernamePlaceholder', {
                        defaultValue: '@Benutzername oder URL',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => removeChannel(index)}
                      aria-label={t('influencer.removeChannel', { defaultValue: 'Kanal entfernen' })}
                      className="grid place-items-center w-10 h-10 rounded-md bg-[#fff0f5] text-[#e9548c]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="followerRange">
                {t('influencer.followersTotal', { defaultValue: 'Follower gesamt' })} *
              </Label>
              <select
                id="followerRange"
                value={form.followerRange}
                onChange={e => updateField('followerRange', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">
                  {t('influencer.followersPlaceholder', { defaultValue: 'Bitte wählen' })}
                </option>
                {FOLLOWER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, { defaultValue: option.value })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h3 className="text-lg font-bold mb-4">
              {t('influencer.categoriesTitle', { defaultValue: 'Welche Inhalte erstellst du?' })}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {CATEGORY_OPTIONS.map(category => {
                const isChecked = form.categories.includes(category.value)
                return (
                  <label key={category.value} className="cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isChecked}
                      onChange={() => toggleCategory(category.value)}
                    />
                    <span
                      className={cn(
                        'block text-center rounded-lg border border-input px-3 py-3 text-xs font-bold transition-colors',
                        isChecked && cn(GRADIENT, 'border-transparent text-white')
                      )}
                    >
                      {t(category.labelKey, { defaultValue: category.value })}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="text-center py-4 px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-20 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">
              {t('influencer.finishTitle', { defaultValue: 'Fast geschafft!' })}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              {t('influencer.finishDesc', {
                defaultValue: 'Akzeptiere den Datenschutz und sende deine Bewerbung ab.',
              })}
            </p>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                required
                className="h-4 w-4 rounded border-input"
              />
              <span>
                {t('influencer.consentPrefix', { defaultValue: 'Ich akzeptiere die' })}{' '}
                <Link href={localePath('/privacy')} target="_blank" className="underline hover:text-[#e9548c]">
                  {t('influencer.consentLink', { defaultValue: 'Datenschutzerklärung' })}
                </Link>
                .
              </span>
            </label>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 border border-input rounded-full text-sm font-semibold uppercase text-xs tracking-wide"
            >
              ← {t('influencer.back', { defaultValue: 'Zurück' })}
            </button>
          ) : onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              {skipLabel || t('influencer.applyLater', { defaultValue: 'Später bewerben' })}
            </button>
          ) : (
            <div />
          )}

          {currentStep < STEP_KEYS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className={cn(
                'px-6 py-3 rounded-full text-sm font-semibold uppercase text-xs tracking-wide text-white hover:opacity-90',
                GRADIENT
              )}
            >
              {t('influencer.next', { defaultValue: 'Weiter' })} →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-6 py-3 rounded-full text-sm font-semibold uppercase text-xs tracking-wide text-white hover:opacity-90 disabled:opacity-50',
                GRADIENT
              )}
            >
              {isSubmitting
                ? t('influencer.submitting', { defaultValue: 'Wird gesendet...' })
                : `${t('influencer.submit', { defaultValue: 'Bewerbung absenden' })} →`}
            </button>
          )}
        </div>

        {stepError && (
          <p role="alert" className="text-center text-xs text-destructive mt-3">
            {stepError}
          </p>
        )}
      </form>
    </>
  )
}
