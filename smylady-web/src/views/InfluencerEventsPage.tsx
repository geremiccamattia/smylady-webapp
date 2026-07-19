'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Megaphone, Star, ClipboardList, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const GRADIENT = 'bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]'

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

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      toast({
        variant: 'destructive',
        title: t('influencerEvents.requiredError', { defaultValue: 'Bitte fülle alle Pflichtfelder aus.' }),
      })
      return
    }

    const promotionLabel = PROMOTION_OPTIONS.find((o) => o.value === form.promotion)
    const promotionText = promotionLabel
      ? t(promotionLabel.labelKey, { defaultValue: promotionLabel.defaultValue })
      : ''

    const subject = encodeURIComponent(`Influencer-Anfrage: ${form.company}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nE-Mail: ${form.email}\nUnternehmen: ${form.company}\nBewerben: ${promotionText}\nNachricht: ${form.message}`
    )
    window.location.href = `mailto:office@shareyourparty.de?subject=${subject}&body=${body}`
    setSubmitted(true)
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
            onClick={() => scrollTo('kontakt')}
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
      </section>

      {/* Contact */}
      <section id="kontakt" className="mt-20 grid md:grid-cols-2 gap-10 items-start scroll-mt-20">
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
                    'Dein E-Mail-Programm wurde geöffnet. Falls nicht, schreib uns direkt an office@shareyourparty.de.',
                })}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                className={cn('w-full rounded-full text-white hover:opacity-90 uppercase text-xs font-black tracking-wide', GRADIENT)}
              >
                {t('influencerEvents.submit', { defaultValue: 'Anfrage senden' })} →
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
