'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Target, Megaphone, Star, ClipboardList, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/api'

const GRADIENT = 'bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]'

const HOW_IT_WORKS_STEPS = [
  { emoji: '📩', titleKey: 'influencerEvents.step1Title', titleDefault: 'Anfrage senden', descKey: 'influencerEvents.step1Desc', descDefault: 'Fülle das Kontaktformular aus und erzähl uns von deinem Projekt, deiner Marke oder deinem Event.' },
  { emoji: '📞', titleKey: 'influencerEvents.step2Title', titleDefault: 'Persönliches Briefing', descKey: 'influencerEvents.step2Desc', descDefault: 'Wir melden uns innerhalb von 24 Stunden bei dir — per Telefon oder E-Mail — und besprechen deine Ziele und Wünsche.' },
  { emoji: '🎯', titleKey: 'influencerEvents.step3Title', titleDefault: 'Creator-Auswahl', descKey: 'influencerEvents.step3Desc', descDefault: 'Wir wählen aus unserem Influencer Club die passenden Creator für deine Zielgruppe und dein Budget aus.' },
  { emoji: '🚀', titleKey: 'influencerEvents.step4Title', titleDefault: 'Kampagne läuft', descKey: 'influencerEvents.step4Desc', descDefault: 'Innerhalb von ca. einer Woche starten die Creator mit Content, Stories und Event-Begleitung. Du lehnst dich zurück.' },
]

const SERVICE_CARDS = [
  { emoji: '🎬', titleKey: 'influencerEvents.service1Title', titleDefault: 'Experience Marketing', descKey: 'influencerEvents.service1Desc', descDefault: 'Creator begleiten dein Event oder dein Pop-up live — echte Eindrücke, echte Reichweite.' },
  { emoji: '📱', titleKey: 'influencerEvents.service2Title', titleDefault: 'Social Media Content', descKey: 'influencerEvents.service2Desc', descDefault: 'Instagram Stories, Reels, TikToks und Posts — produziert und gepostet von unseren Creatorn.' },
  { emoji: '🎉', titleKey: 'influencerEvents.service3Title', titleDefault: 'Influencer Events', descKey: 'influencerEvents.service3Desc', descDefault: 'Wir organisieren exklusive Events mit Share Your Party und laden unsere Creator ein — deine Marke im Mittelpunkt.' },
  { emoji: '📸', titleKey: 'influencerEvents.service4Title', titleDefault: 'Produkt- & Location-Reviews', descKey: 'influencerEvents.service4Desc', descDefault: 'Creator testen und präsentieren dein Produkt, dein Restaurant oder deine Location authentisch auf ihren Kanälen.' },
  { emoji: '📋', titleKey: 'influencerEvents.service5Title', titleDefault: 'Briefing & Koordination', descKey: 'influencerEvents.service5Desc', descDefault: 'Wir übernehmen die komplette Organisation — Briefing, Creator-Auswahl, Zeitplanung und Qualitätskontrolle.' },
  { emoji: '📊', titleKey: 'influencerEvents.service6Title', titleDefault: 'Reporting & Ergebnisse', descKey: 'influencerEvents.service6Desc', descDefault: 'Nach der Kampagne erhältst du einen Überblick über Reichweite, Impressions und Engagement.' },
]

const CREATOR_CARDS = [
  { emoji: '🎶', bg: '#F5F0FF', nameKey: 'influencerEvents.creator1Name', nameDefault: 'Nightlife Creator', categoryKey: 'influencerEvents.creator1Category', categoryDefault: 'Nightlife & Clubbing', followersKey: 'influencerEvents.creator1Followers', followersDefault: '8.000+ Follower' },
  { emoji: '🍽', bg: '#FFF8F0', nameKey: 'influencerEvents.creator2Name', nameDefault: 'Food Creator', categoryKey: 'influencerEvents.creator2Category', categoryDefault: 'Food & Gastro', followersKey: 'influencerEvents.creator2Followers', followersDefault: '5.500+ Follower' },
  { emoji: '✨', bg: '#FFF0F6', nameKey: 'influencerEvents.creator3Name', nameDefault: 'Lifestyle Creator', categoryKey: 'influencerEvents.creator3Category', categoryDefault: 'Lifestyle & Fashion', followersKey: 'influencerEvents.creator3Followers', followersDefault: '12.000+ Follower' },
  { emoji: '🎵', bg: '#F0FFF4', nameKey: 'influencerEvents.creator4Name', nameDefault: 'Music Creator', categoryKey: 'influencerEvents.creator4Category', categoryDefault: 'Musik & Events', followersKey: 'influencerEvents.creator4Followers', followersDefault: '6.000+ Follower' },
]

const FAQ_ITEMS = [
  { qKey: 'influencerEvents.faq1Q', qDefault: 'Was kostet eine Influencer-Kampagne?', aKey: 'influencerEvents.faq1A', aDefault: 'Die Kosten hängen vom Umfang, der Anzahl der Creator und dem gewünschten Format ab. Wir erstellen dir ein individuelles Angebot — unverbindlich und kostenlos.' },
  { qKey: 'influencerEvents.faq2Q', qDefault: 'Wie schnell kann eine Kampagne starten?', aKey: 'influencerEvents.faq2A', aDefault: 'In der Regel planen wir mit etwa einer Woche Vorlaufzeit. Bei einfacheren Formaten kann es auch schneller gehen.' },
  { qKey: 'influencerEvents.faq3Q', qDefault: 'Welche Branchen bedient ihr?', aKey: 'influencerEvents.faq3A', aDefault: 'Unser Fokus liegt auf Gastronomie, Bars, Events, lokale Shops und kleinere Marken in Wien. Grundsätzlich sind wir aber für jedes Projekt offen.' },
  { qKey: 'influencerEvents.faq4Q', qDefault: 'Welche Plattformen werden bespielt?', aKey: 'influencerEvents.faq4A', aDefault: 'Unsere Creator sind auf Instagram, TikTok und Snapchat aktiv. Je nach Projekt wählen wir die passenden Kanäle.' },
  { qKey: 'influencerEvents.faq5Q', qDefault: 'Bekomme ich ein Reporting nach der Kampagne?', aKey: 'influencerEvents.faq5A', aDefault: 'Ja, du erhältst einen Überblick über Reichweite, Impressions, Engagement und erstellten Content.' },
]

const PROMOTION_OPTIONS = [
  { value: 'product', labelKey: 'influencerEvents.promotionProduct', defaultValue: 'Produkt' },
  { value: 'brand', labelKey: 'influencerEvents.promotionBrand', defaultValue: 'Marke' },
  { value: 'service', labelKey: 'influencerEvents.promotionService', defaultValue: 'Dienstleistung' },
  { value: 'event', labelKey: 'influencerEvents.promotionEvent', defaultValue: 'Event' },
  { value: 'venue', labelKey: 'influencerEvents.promotionVenue', defaultValue: 'Restaurant / Location' },
  { value: 'other', labelKey: 'influencerEvents.promotionOther', defaultValue: 'Sonstiges' },
]

interface FormState {
  name: string
  email: string
  company: string
  promotion: string
  message: string
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  company: '',
  promotion: '',
  message: '',
}

export default function InfluencerEventsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      toast({
        variant: 'destructive',
        title: t('influencerEvents.requiredError', { defaultValue: 'Bitte fülle alle Pflichtfelder aus.' }),
      })
      return
    }

    setIsLoading(true)
    try {
      await apiClient.post('/influencer/business-inquiry', {
        name: form.name,
        email: form.email,
        company: form.company,
        promotion: form.promotion,
        message: form.message,
      })
      setSubmitted(true)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('influencerEvents.submitError', { defaultValue: 'Anfrage konnte nicht gesendet werden.' }),
        description: error.response?.data?.message || '',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-16">
      {/* Hero */}
      <section
        className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden rounded-3xl mt-4"
        style={{
          backgroundImage: "url('/images/influencer/influencer-events-hero-2.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative z-10 max-w-xl px-6 md:px-14 py-16 text-white">
          <p className="mb-4 text-[13px] font-black uppercase tracking-wide text-[#ff9a6a]">
            {t('influencerEvents.eyebrow', { defaultValue: 'Influencer-Marketing für Unternehmen' })}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.08] tracking-tight">
            <span className="block whitespace-nowrap">
              {t('influencerEvents.heroHeadline1', { defaultValue: 'Die richtigen Creator.' })}
            </span>
            <span className={cn(GRADIENT, 'block bg-clip-text text-transparent')}>
              {t('influencerEvents.heroHeadline2', { defaultValue: 'Für deine Marke.' })}
            </span>
          </h1>
          <p className="mt-6 text-white/85 text-base leading-relaxed max-w-md">
            {t('influencerEvents.heroLead', {
              defaultValue:
                'Wir verbinden deine Marke mit Creatorn, die deine Zielgruppe wirklich erreichen.',
            })}
          </p>
          <Button
            size="xl"
            className={cn('mt-8 rounded-full text-white hover:opacity-90 uppercase text-xs font-black tracking-wide', GRADIENT)}
            onClick={() => scrollTo('contact-form')}
          >
            {t('influencerEvents.ctaFind', { defaultValue: 'Influencer finden' })} →
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-16 px-2">
        <p className="text-center text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-8">
          {t('influencerEvents.benefitsEyebrow', { defaultValue: 'Warum mit Share Your Party?' })}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 md:divide-x divide-border">
          {[
            { icon: Target, titleKey: 'influencerEvents.benefitsTitle1', titleDefault: 'Passende Creator', descKey: 'influencerEvents.benefitsDesc1', descDefault: 'Wir finden Influencer, die wirklich zu deiner Marke und Zielgruppe passen.' },
            { icon: Megaphone, titleKey: 'influencerEvents.benefitsTitle2', titleDefault: 'Mehr Reichweite', descKey: 'influencerEvents.benefitsDesc2', descDefault: 'Erreiche neue Kunden und steigere Bekanntheit, Vertrauen und Engagement.' },
            { icon: Star, titleKey: 'influencerEvents.benefitsTitle3', titleDefault: 'Authentisch & Echt', descKey: 'influencerEvents.benefitsDesc3', descDefault: 'Echte Empfehlungen statt Werbung – für maximale Glaubwürdigkeit und starke Ergebnisse.' },
            { icon: ClipboardList, titleKey: 'influencerEvents.benefitsTitle4', titleDefault: 'Für jeden Anlass', descKey: 'influencerEvents.benefitsDesc4', descDefault: 'Ob Produkt, Marke, Event oder Dienstleistung – wir haben die passenden Creator.' },
          ].map((benefit) => (
            <article key={benefit.titleKey} className="text-center px-4 md:px-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <benefit.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
              </div>
              <h2 className="mb-2 text-base font-bold">
                {t(benefit.titleKey, { defaultValue: benefit.titleDefault })}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(benefit.descKey, { defaultValue: benefit.descDefault })}
              </p>
            </article>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('px-8 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity', GRADIENT)}
          >
            {t('influencerEvents.ctaButton', { defaultValue: 'Jetzt Anfrage senden →' })}
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20 px-2">
        <p className="text-center text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-3">
          {t('influencerEvents.howItWorksEyebrow', { defaultValue: 'In 4 einfachen Schritten' })}
        </p>
        <h2 className="text-center text-3xl md:text-4xl font-black leading-[1.1] tracking-tight mb-10">
          {t('influencerEvents.howItWorksHeadline', { defaultValue: 'Von der Anfrage zur Kampagne' })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article key={step.titleKey} className="text-center px-4">
              <div
                className={cn(
                  'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-black',
                  GRADIENT
                )}
              >
                {index + 1}
              </div>
              <h3 className="mb-2 text-base font-bold">
                <span className="mr-1">{step.emoji}</span>
                {t(step.titleKey, { defaultValue: step.titleDefault })}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(step.descKey, { defaultValue: step.descDefault })}
              </p>
            </article>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('px-8 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity', GRADIENT)}
          >
            {t('influencerEvents.ctaButton', { defaultValue: 'Jetzt Anfrage senden →' })}
          </button>
        </div>
      </section>

      {/* Service */}
      <section className="mt-20 px-2">
        <p className="text-center text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-3">
          {t('influencerEvents.serviceEyebrow', { defaultValue: 'Was wir anbieten' })}
        </p>
        <h2 className="text-center text-3xl md:text-4xl font-black leading-[1.1] tracking-tight">
          {t('influencerEvents.serviceHeadline', { defaultValue: 'Influencer-Marketing, das wirkt.' })}
        </h2>
        <p className="mt-4 text-center text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
          {t('influencerEvents.serviceSubline', {
            defaultValue:
              'Wir kümmern uns um alles — von der Creator-Auswahl bis zum fertigen Content. Du konzentrierst dich auf dein Business.',
          })}
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICE_CARDS.map((card) => (
            <article
              key={card.titleKey}
              className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-3xl mb-4">{card.emoji}</div>
              <h3 className="mb-2 text-base font-bold">
                {t(card.titleKey, { defaultValue: card.titleDefault })}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(card.descKey, { defaultValue: card.descDefault })}
              </p>
            </article>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('px-8 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity', GRADIENT)}
          >
            {t('influencerEvents.ctaButton', { defaultValue: 'Jetzt Anfrage senden →' })}
          </button>
        </div>
      </section>

      {/* Creators */}
      <section className="mt-20 px-2">
        <p className="text-center text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-3">
          {t('influencerEvents.creatorsEyebrow', { defaultValue: 'Unser Netzwerk' })}
        </p>
        <h2 className="text-center text-3xl md:text-4xl font-black leading-[1.1] tracking-tight">
          {t('influencerEvents.creatorsHeadline', { defaultValue: 'Die Menschen hinter den Kampagnen' })}
        </h2>
        <p className="mt-4 text-center text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
          {t('influencerEvents.creatorsSubline', {
            defaultValue:
              'Unser Influencer Club besteht aus ausgewählten Creatorn aus Wien — authentisch, engagiert und bereit für deine Marke.',
          })}
        </p>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {CREATOR_CARDS.map((card) => (
            <article key={card.nameKey} className="text-center">
              <div
                className="aspect-square rounded-2xl flex items-center justify-center text-5xl"
                style={{ backgroundColor: card.bg }}
              >
                {card.emoji}
              </div>
              <h3 className="mt-3 text-sm font-bold">
                {t(card.nameKey, { defaultValue: card.nameDefault })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(card.categoryKey, { defaultValue: card.categoryDefault })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(card.followersKey, { defaultValue: card.followersDefault })}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href={localePath('/influencer-club')}
            className="text-sm font-bold text-[#e9548c] hover:opacity-80"
          >
            {t('influencerEvents.creatorsCta', {
              defaultValue: 'Du bist Creator? Bewirb dich für unseren Influencer Club →',
            })}
          </Link>
        </div>
        <div className="flex justify-center mt-8">
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('px-8 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity', GRADIENT)}
          >
            {t('influencerEvents.ctaButton', { defaultValue: 'Jetzt Anfrage senden →' })}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20 px-2 max-w-3xl mx-auto">
        <p className="text-center text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-3">
          {t('influencerEvents.faqEyebrow', { defaultValue: 'Häufige Fragen' })}
        </p>
        <h2 className="text-center text-3xl md:text-4xl font-black leading-[1.1] tracking-tight mb-10">
          {t('influencerEvents.faqHeadline', { defaultValue: 'Alles was du wissen musst' })}
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index
            return (
              <div key={item.qKey} className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold">
                    {t(item.qKey, { defaultValue: item.qDefault })}
                  </span>
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300', isOpen && 'rotate-180')}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {t(item.aKey, { defaultValue: item.aDefault })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center mt-8">
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('px-8 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity', GRADIENT)}
          >
            {t('influencerEvents.ctaButton', { defaultValue: 'Jetzt Anfrage senden →' })}
          </button>
        </div>
      </section>

      {/* Contact */}
      <section id="contact-form" className="mt-20 grid md:grid-cols-2 gap-10 items-start scroll-mt-20">
        <div>
          <p className="text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-3">
            {t('influencerEvents.contactEyebrow', { defaultValue: "Los geht's" })}
          </p>
          <h2 className="text-3xl md:text-4xl font-black leading-[1.1] tracking-tight">
            {t('influencerEvents.contactHeadline', { defaultValue: 'Bereit für deine nächste Influencer-Kampagne?' })}
          </h2>
          <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-md">
            {t('influencerEvents.contactLead', {
              defaultValue: 'Erzähl uns von deinem Projekt und wir finden die passenden Creator für deine Marke.',
            })}
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { key: 'influencerEvents.trust1', defaultValue: 'Erfahrenes Netzwerk' },
              { key: 'influencerEvents.trust2', defaultValue: '100% authentisch' },
              { key: 'influencerEvents.trust3', defaultValue: 'Sicher & zuverlässig' },
            ].map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-sm font-medium">
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white', GRADIENT)}>
                  <Check className="h-3.5 w-3.5" />
                </span>
                {t(item.key, { defaultValue: item.defaultValue })}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white shadow-lg p-6 md:p-8">
          {submitted ? (
            <div className="text-center py-10">
              <div className={cn('mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full', GRADIENT)}>
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('influencerEvents.successTitle', { defaultValue: 'Anfrage gesendet!' })}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t('influencerEvents.successDesc', {
                  defaultValue:
                    'Wir haben deine Anfrage erhalten und melden uns in Kürze bei dir.',
                })}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 influencer-event">
              <div className="space-y-1.5">
                <Label htmlFor="ie-name">{t('influencerEvents.nameLabel', { defaultValue: 'Name' })} *</Label>
                <Input
                  id="ie-name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="focus-visible:ring-primary"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ie-email">{t('influencerEvents.emailLabel', { defaultValue: 'E-Mail' })} *</Label>
                <Input
                  id="ie-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="focus-visible:ring-primary"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ie-company">{t('influencerEvents.companyLabel', { defaultValue: 'Unternehmen' })} *</Label>
                <Input
                  id="ie-company"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className="focus-visible:ring-primary"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ie-promotion">
                  {t('influencerEvents.promotionLabel', { defaultValue: 'Was möchtest du bewerben?' })}
                </Label>
                <Select value={form.promotion} onValueChange={(value) => updateField('promotion', value)}>
                  <SelectTrigger id="ie-promotion" className="focus:ring-primary">
                    <SelectValue placeholder={t('influencerEvents.selectPromotion', { defaultValue: 'Bitte wählen' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMOTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey, { defaultValue: option.defaultValue })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ie-message">
                  {t('influencerEvents.messageLabel', { defaultValue: 'Nachricht' })}{' '}
                  <em className="font-normal text-muted-foreground not-italic">
                    {t('influencer.optionalLabel', { defaultValue: '(optional)' })}
                  </em>
                </Label>
                <textarea
                  id="ie-message"
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder={t('influencerEvents.messagePlaceholder', { defaultValue: 'Erzähl uns von deinem Projekt...' })}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={cn('w-full rounded-full text-white hover:opacity-90 uppercase text-xs font-black tracking-wide', GRADIENT)}
              >
                {isLoading
                  ? t('common.loading', { defaultValue: 'Wird gesendet...' })
                  : `${t('influencerEvents.submit', { defaultValue: 'Anfrage senden' })} →`}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
