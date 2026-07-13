'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import {
  Instagram,
  Music2,
  Ghost,
  Globe,
  Plus,
  X,
  Crown,
  TrendingUp,
  Sparkles,
  Users,
  User,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/services/api'
import { useLocalePath } from '@/hooks/useLocalePath'
import { cn } from '@/lib/utils'

const GRADIENT = 'bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]'

interface OtherChannel {
  platform: string
  username: string
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  city: string
  age: string
  instagram: string
  tiktok: string
  snapchat: string
  otherChannels: OtherChannel[]
  followerRange: string
  categories: string[]
}

const INITIAL_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  city: 'Wien',
  age: '',
  instagram: '',
  tiktok: '',
  snapchat: '',
  otherChannels: [],
  followerRange: '',
  categories: [],
}

const FOLLOWER_OPTIONS = [
  { value: 'Unter 1.500', labelKey: 'influencer.followersUnder1500' },
  { value: '1.500–5.000', labelKey: 'influencer.followers1500to5000' },
  { value: '5.001–10.000', labelKey: 'influencer.followers5001to10000' },
  { value: '10.001–25.000', labelKey: 'influencer.followers10001to25000' },
  { value: '25.001–50.000', labelKey: 'influencer.followers25001to50000' },
  { value: '50.001–100.000', labelKey: 'influencer.followers50001to100000' },
  { value: 'Über 100.000', labelKey: 'influencer.followersOver100000' },
]

const CATEGORY_OPTIONS = [
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

const OTHER_PLATFORMS = [
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function InfluencerClubPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()

  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [consent, setConsent] = useState(false)
  const [stepError, setStepError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (value: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }))
  }

  const addChannel = () => {
    setForm((prev) => ({
      ...prev,
      otherChannels: [...prev.otherChannels, { platform: OTHER_PLATFORMS[0].value, username: '' }],
    }))
  }

  const removeChannel = (index: number) => {
    setForm((prev) => ({
      ...prev,
      otherChannels: prev.otherChannels.filter((_, i) => i !== index),
    }))
  }

  const updateChannel = (index: number, field: keyof OtherChannel, value: string) => {
    setForm((prev) => ({
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
      if (!EMAIL_REGEX.test(form.email.trim())) {
        return t('influencer.validationRequired', { defaultValue: 'Bitte fülle alle Pflichtfelder aus.' })
      }
      if (!age || age < 18) {
        return t('influencer.validationRequired', { defaultValue: 'Bitte fülle alle Pflichtfelder aus.' })
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
    setCurrentStep((prev) => Math.min(prev + 1, STEP_KEYS.length - 1))
  }

  const handleBack = () => {
    setStepError('')
    setCurrentStep((prev) => Math.max(prev - 1, 0))
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
        email: form.email.trim(),
        city: form.city.trim(),
        age: parseInt(form.age, 10),
        instagram: form.instagram.trim(),
        tiktok: form.tiktok.trim() || undefined,
        snapchat: form.snapchat.trim() || undefined,
        otherChannels: form.otherChannels
          .filter((c) => c.username.trim())
          .map((c) => ({ platform: c.platform, username: c.username.trim() })),
        followerRange: form.followerRange,
        categories: form.categories,
      })
      setSubmitted(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description:
          error.response?.data?.message ||
          t('influencer.errorGeneric', { defaultValue: 'Bewerbung konnte nicht gesendet werden. Bitte versuche es erneut.' }),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepIcons = [User, Instagram, Sparkles, Check]

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Hero */}
      <section className="grid md:grid-cols-[0.86fr_1.14fr] gap-10 items-center py-6 md:py-10">
        <div>
          <p className="mb-4 text-[13px] font-black uppercase tracking-wide text-[#e9548c]">
            {t('influencer.eyebrow', { defaultValue: 'Share Your Party Influencer Club' })}
          </p>
          <h1 className="text-[40px] sm:text-[56px] md:text-[68px] font-black leading-[1.05] tracking-tight">
            {t('influencer.heroHeadline1', { defaultValue: 'Create moments.' })}
            <br />
            {t('influencer.heroHeadline2', { defaultValue: 'Inspire your city.' })}
            <br />
            <span className={cn(GRADIENT, 'bg-clip-text text-transparent')}>
              {t('influencer.heroHeadline3', { defaultValue: 'Share Your Party.' })}
            </span>
          </h1>
          <div className={cn('w-14 h-0.5 my-6', GRADIENT)} />
          <p className="text-muted-foreground text-base leading-relaxed max-w-md">
            {t('influencer.heroLead', {
              defaultValue:
                'Werde Teil des Share Your Party Influencer Clubs. Erlebe exklusive Events, teile echte Momente und wachse gemeinsam mit einer aktiven Community.',
            })}
          </p>
          <div className="flex items-center gap-8 mt-8 flex-wrap">
            <Button
              size="xl"
              className={cn('rounded-full text-white hover:opacity-90 uppercase text-xs font-black tracking-wide', GRADIENT)}
              onClick={() => scrollTo('bewerbung')}
            >
              {t('influencer.ctaApply', { defaultValue: 'Jetzt bewerben' })} →
            </Button>
            <button
              type="button"
              onClick={() => scrollTo('vorteile')}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wide hover:text-[#e9548c] transition-colors"
            >
              {t('influencer.ctaLearnMore', { defaultValue: 'Mehr erfahren' })} ↓
            </button>
          </div>
        </div>

        <div className="relative min-h-[380px] md:min-h-[500px]">
          <div
            className="absolute inset-x-2 inset-y-2 md:inset-2 overflow-hidden bg-muted"
            style={{
              clipPath:
                "path('M 122 40 C 218 4, 373 2, 462 73 C 544 139, 548 318, 477 402 C 408 484, 265 504, 157 458 C 49 411, 1 319, 23 219 C 39 144, 57 67, 122 40 Z')",
              borderRadius: '40% 55% 45% 55% / 48% 42% 58% 52%',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/influencer/hero.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div
            className={cn('hidden md:block absolute w-44 h-48 -right-3 bottom-6 opacity-80', GRADIENT)}
            style={{ borderRadius: '44% 56% 60% 40% / 42% 47% 53% 58%' }}
          />
          <div className="absolute left-2 md:left-8 bottom-0 flex items-center gap-3 bg-white rounded-full shadow-lg px-5 py-3 min-w-[240px]">
            <div className="flex">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-[#3b1a15] to-[#f4a366]',
                    i > 0 && '-ml-2'
                  )}
                />
              ))}
            </div>
            <div>
              <strong className="block text-[#e9548c] text-lg leading-none">+350</strong>
              <small className="text-[9px] uppercase tracking-wide text-muted-foreground">
                {t('influencer.activeCreators', { defaultValue: 'Aktive Creator' })}
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        id="vorteile"
        className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 md:gap-x-0 md:divide-x divide-border mt-6 p-6 md:p-9 rounded-2xl bg-white shadow-lg scroll-mt-20"
      >
        {[
          { icon: Sparkles, color: '#e9548c', titleKey: 'influencer.benefitsTitle1', descKey: 'influencer.benefitsDesc1', titleDefault: 'Exklusive Events', descDefault: 'Zugang zu den besten Partys & Events in Wien.' },
          { icon: Crown, color: '#ff720e', titleKey: 'influencer.benefitsTitle2', descKey: 'influencer.benefitsDesc2', titleDefault: 'VIP Access', descDefault: 'VIP-Zugang, besondere Goodies und mehr.' },
          { icon: TrendingUp, color: '#ffb800', titleKey: 'influencer.benefitsTitle3', descKey: 'influencer.benefitsDesc3', titleDefault: 'Wachsen & verdienen', descDefault: 'Kooperationen, Affiliate-Programme und faire Vergütungen.' },
          { icon: Users, color: '#6f35ff', titleKey: 'influencer.benefitsTitle4', descKey: 'influencer.benefitsDesc4', titleDefault: 'Community & Support', descDefault: 'Werde Teil einer aktiven Creator Community mit echtem Support.' },
        ].map((benefit) => (
          <article key={benefit.titleKey} className="text-center px-2 md:px-6">
            <benefit.icon className="mx-auto h-9 w-9" style={{ color: benefit.color }} strokeWidth={1.5} />
            <h2 className="mt-4 mb-3 text-[13px] font-bold uppercase tracking-wide">
              {t(benefit.titleKey, { defaultValue: benefit.titleDefault })}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(benefit.descKey, { defaultValue: benefit.descDefault })}
            </p>
          </article>
        ))}
      </section>

      {/* Story */}
      <section className="grid md:grid-cols-[0.72fr_1.28fr] gap-10 items-center py-16 px-2">
        <div className="text-center md:text-left">
          <p className="mb-2 text-[13px] font-black uppercase tracking-wide text-[#e9548c]">
            {t('influencer.storyEyebrow', { defaultValue: 'Deine Story.' })}
          </p>
          <h2 className="text-3xl md:text-[44px] font-black leading-[1.08] tracking-tight">
            {t('influencer.storyHeadline1', { defaultValue: 'Deine Bühne.' })}
            <br />
            <span className={cn(GRADIENT, 'bg-clip-text text-transparent')}>
              {t('influencer.storyHeadline2', { defaultValue: 'Deine Community.' })}
            </span>
          </h2>
          <div className={cn('w-14 h-0.5 my-6 mx-auto md:mx-0', GRADIENT)} />
          <p className="text-[#55555b] text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
            {t('influencer.storyLead', {
              defaultValue:
                'Wir bringen Creator mit den besten Events, Brands und Menschen zusammen. Für unvergessliche Momente und echten Impact.',
            })}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-5">
          {[
            { src: '/images/influencer/story-1.jpg', rotate: '-rotate-[4deg]', titleKey: 'influencer.story1Title', titleDefault: 'Backstage pass unlocked' },
            { src: '/images/influencer/story-2.jpg', rotate: '', titleKey: 'influencer.story2Title', titleDefault: 'Best night in Vienna! 🔥' },
            { src: '/images/influencer/story-3.jpg', rotate: 'rotate-[4deg]', titleKey: 'influencer.story3Title', titleDefault: 'Moments that matter' },
          ].map((card) => (
            <article
              key={card.titleKey}
              className={cn(
                'relative w-[30%] md:w-[190px] h-[220px] md:h-[305px] rounded-xl md:rounded-2xl overflow-hidden bg-black shadow-xl shrink-0',
                card.rotate
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 p-3 md:p-5 flex flex-col justify-end text-white bg-gradient-to-t from-black/80 via-black/10 to-transparent">
                <strong className="text-sm md:text-xl leading-tight">
                  {t(card.titleKey, { defaultValue: card.titleDefault })}
                </strong>
                <small className="mt-2 md:mt-4 text-[8px] md:text-[9px]">@shareyourparty</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="bewerbung" className="grid md:grid-cols-[230px_1fr] rounded-3xl overflow-hidden bg-white shadow-lg scroll-mt-20">
        <div className="relative hidden md:block overflow-hidden bg-[#fff2ed]">
          <div className={cn('absolute w-40 h-40 -left-16 -bottom-14 rounded-full opacity-65', GRADIENT)} />
          <div className={cn('absolute w-24 h-24 -right-8 -bottom-6 rounded-full opacity-65', GRADIENT)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/influencer/creator.jpg" alt="" className="relative z-10 w-full h-full object-cover" />
        </div>

        <div className="p-5 md:p-8">
          {submitted ? (
            <div className="text-center py-16 px-4">
              <div className={cn('mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full', GRADIENT)}>
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('influencer.successTitle', { defaultValue: 'Bewerbung erfolgreich eingereicht!' })}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('influencer.successDesc', { defaultValue: 'Danke für deine Bewerbung. Wir melden uns bald bei dir.' })}
              </p>
            </div>
          ) : (
            <>
              {/* Step nav */}
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

              <form onSubmit={handleSubmit} className="pt-6">
                {currentStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">{t('influencer.firstName', { defaultValue: 'Vorname' })} *</Label>
                      <Input id="firstName" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">{t('influencer.lastName', { defaultValue: 'Nachname' })} *</Label>
                      <Input id="lastName" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">{t('influencer.email', { defaultValue: 'E-Mail-Adresse' })} *</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city">{t('influencer.city', { defaultValue: 'Wohnort' })} *</Label>
                      <Input id="city" value={form.city} onChange={(e) => updateField('city', e.target.value)} required />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="age">{t('influencer.age', { defaultValue: 'Alter' })} *</Label>
                      <Input
                        id="age"
                        type="number"
                        min={18}
                        value={form.age}
                        onChange={(e) => updateField('age', e.target.value)}
                        placeholder={t('influencer.agePlaceholder', { defaultValue: 'z. B. 25' })}
                        className="max-w-[140px]"
                        required
                      />
                    </div>
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
                          onChange={(e) => updateField('instagram', e.target.value)}
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
                          onChange={(e) => updateField('tiktok', e.target.value)}
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
                          onChange={(e) => updateField('snapchat', e.target.value)}
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
                              onChange={(e) => updateChannel(index, 'platform', e.target.value)}
                              className="h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {OTHER_PLATFORMS.map((platform) => (
                                <option key={platform.value} value={platform.value}>
                                  {t(platform.labelKey, { defaultValue: platform.value })}
                                </option>
                              ))}
                            </select>
                            <Input
                              value={channel.username}
                              onChange={(e) => updateChannel(index, 'username', e.target.value)}
                              placeholder={t('influencer.usernamePlaceholder', { defaultValue: '@Benutzername oder URL' })}
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
                      <Label htmlFor="followerRange">{t('influencer.followersTotal', { defaultValue: 'Follower gesamt' })} *</Label>
                      <select
                        id="followerRange"
                        value={form.followerRange}
                        onChange={(e) => updateField('followerRange', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      >
                        <option value="">{t('influencer.followersPlaceholder', { defaultValue: 'Bitte wählen' })}</option>
                        {FOLLOWER_OPTIONS.map((option) => (
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
                      {CATEGORY_OPTIONS.map((category) => {
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
                      {t('influencer.finishDesc', { defaultValue: 'Akzeptiere den Datenschutz und sende deine Bewerbung ab.' })}
                    </p>
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
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

                <div className="flex items-center justify-between mt-6">
                  {currentStep > 0 ? (
                    <Button type="button" variant="outline" className="rounded-full uppercase text-xs font-black" onClick={handleBack}>
                      ← {t('influencer.back', { defaultValue: 'Zurück' })}
                    </Button>
                  ) : (
                    <span />
                  )}
                  {currentStep < STEP_KEYS.length - 1 ? (
                    <Button
                      type="button"
                      className={cn('rounded-full text-white hover:opacity-90 uppercase text-xs font-black', GRADIENT)}
                      onClick={handleNext}
                    >
                      {t('influencer.next', { defaultValue: 'Weiter' })} →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      className={cn('rounded-full text-white hover:opacity-90 uppercase text-xs font-black', GRADIENT)}
                    >
                      {isSubmitting
                        ? t('influencer.submitting', { defaultValue: 'Wird gesendet...' })
                        : `${t('influencer.submit', { defaultValue: 'Bewerbung absenden' })} →`}
                    </Button>
                  )}
                </div>
                {stepError && (
                  <p role="alert" className="text-center text-xs text-destructive mt-3">
                    {stepError}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </section>

      {/* Closing */}
      <p className="text-center mt-14 mb-1 text-xs tracking-[0.4em] uppercase text-muted-foreground">
        {t('influencer.closingLine', { defaultValue: 'Be part of something real.' })}
      </p>
      <div className="text-center text-[#e9548c] text-2xl mb-8">♡</div>
    </div>
  )
}
