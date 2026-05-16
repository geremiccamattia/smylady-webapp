'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Check, ChevronDown, MapPin, Megaphone, Upload, X, ArrowLeft, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/services/api'
import LocationModal, { LocationResult } from '@/components/LocationModal'

const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    days: 7,
    radius: 25,
    description: '1 Anzeige · 7 Tage · 25 km Umkreis',
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 149,
    days: 30,
    radius: 50,
    description: '1 Anzeige · 30 Tage · 50 km Umkreis',
  },
} as const

const FREE_PLAN = {
  id: 'free' as const,
  name: 'Free Spotlight',
  price: 0,
  days: null as number | null,
  radius: 30,
  description: 'Intern · Unbegrenzt · 30 km Umkreis',
}

type PlanId = keyof typeof PLANS

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? '')

// ── Payment UI ────────────────────────────────────────────────────────────────

function SpotlightPaymentForm({
  plan,
  onBack,
  onSubmit,
  isLoading,
}: {
  clientSecret: string
  plan: typeof PLANS[PlanId]
  onBack: () => void
  onSubmit: () => void
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          3. Zahlung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{plan.name}</span>
            <span className="font-medium">{plan.days} Tage · {plan.radius} km</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>Gesamt</span>
            <span>€{plan.price}.00</span>
          </div>
        </div>
        <PaymentElement />
        <p className="text-xs text-muted-foreground">
          Deine Anzeige wird nach Zahlungseingang und kurzer Prüfung freigeschaltet.
        </p>
        <Button
          variant="gradient"
          className="w-full"
          onClick={onSubmit}
          loading={isLoading}
        >
          <Megaphone className="h-4 w-4 mr-2" />
          Jetzt bezahlen – €{plan.price}.00
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Payment Handler (needs to be inside <Elements>) ───────────────────────────

function SpotlightPaymentHandler({
  plan,
  formPayload,
  onBack,
}: {
  plan: typeof PLANS[PlanId]
  formPayload: FormData
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const navigate = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setIsLoading(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      })
      if (error) {
        toast({ variant: 'destructive', title: 'Zahlung fehlgeschlagen', description: error.message })
        return
      }
      if (paymentIntent?.status === 'succeeded') {
        formPayload.append('paymentIntentId', paymentIntent.id)
        await apiClient.post('/spotlight', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast({
          title: 'Spotlight eingereicht ✓',
          description: 'Deine Anzeige wird nach kurzer Prüfung freigeschaltet.',
        })
        router.push('/profile')
      }
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Bitte erneut versuchen.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SpotlightPaymentForm
      clientSecret=""
      plan={plan}
      onBack={onBack}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreateSpotlight() {
  const navigate = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = ['geremicca.mattia+1@gmail.com', 'smylady@hotmail.com'].includes(user?.email ?? '')

  const [selectedPlan, setSelectedPlan] = useState<PlanId | 'free' | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [showEnglishFields, setShowEnglishFields] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [formPayload, setFormPayload] = useState<FormData | null>(null)
  const [formData, setFormData] = useState({
    headline: '',
    description: '',
    headlineEn: '',
    descriptionEn: '',
    targetUrl: '',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageFile(null)
  }

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !formData.headline || !formData.targetUrl || !imageFile || !selectedLocation) {
      toast({ variant: 'destructive', title: 'Pflichtfelder fehlen', description: 'Bitte alle Pflichtfelder ausfüllen.' })
      return
    }
    setIsLoading(true)

    if (selectedPlan === 'free') {
      try {
        const payload = new FormData()
        payload.append('headline', formData.headline)
        payload.append('description', formData.description)
        if (formData.headlineEn) payload.append('headlineEn', formData.headlineEn)
        if (formData.descriptionEn) payload.append('descriptionEn', formData.descriptionEn)
        payload.append('targetUrl', formData.targetUrl)
        payload.append('latitude', selectedLocation.lat.toString())
        payload.append('longitude', selectedLocation.lng.toString())
        payload.append('radius', '30')
        payload.append('plan', 'free')
        payload.append('image', imageFile)
        await apiClient.post('/spotlight/free', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast({ title: 'Free Spotlight erstellt ✓' })
        router.push('/profile')
      } catch {
        toast({ variant: 'destructive', title: 'Fehler', description: 'Spotlight konnte nicht erstellt werden.' })
      } finally {
        setIsLoading(false)
      }
      return
    }

    try {
      const plan = PLANS[selectedPlan]

      const { data } = await apiClient.post('/spotlight/payment-intent', {
        plan: selectedPlan,
      })

      const payload = new FormData()
      payload.append('headline', formData.headline)
      payload.append('description', formData.description)
      if (formData.headlineEn) payload.append('headlineEn', formData.headlineEn)
      if (formData.descriptionEn) payload.append('descriptionEn', formData.descriptionEn)
      payload.append('targetUrl', formData.targetUrl)
      payload.append('latitude', selectedLocation.lat.toString())
      payload.append('longitude', selectedLocation.lng.toString())
      payload.append('radius', plan.radius.toString())
      payload.append('plan', selectedPlan)
      payload.append('durationDays', plan.days.toString())
      payload.append('image', imageFile)

      setFormPayload(payload)
      setClientSecret(data.data.clientSecret)
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Zahlung konnte nicht initiiert werden.' })
    } finally {
      setIsLoading(false)
    }
  }

  // ── Payment Step ─────────────────────────────────────────────────────────────

  if (clientSecret && formPayload && selectedPlan) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setClientSecret(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-orange-500" />
            Spotlight bezahlen
          </h1>
        </div>
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, locale: 'de' }}
        >
          <SpotlightPaymentHandler
            plan={PLANS[selectedPlan as PlanId]}
            formPayload={formPayload}
            onBack={() => setClientSecret(null)}
          />
        </Elements>
      </div>
    )
  }

  // ── Form Step (Step 1 + 2) ────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-orange-500" />
            Spotlight erstellen
          </h1>
          <p className="text-sm text-muted-foreground">
            Erreiche gezielt Nutzer in deiner Region.
          </p>
        </div>
      </div>

      <form onSubmit={handleProceedToPayment} className="space-y-6">

        {/* Step 1: Plan wählen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Plan wählen</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            {(Object.values(PLANS) as typeof PLANS[PlanId][]).map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id as PlanId)}
                className={cn(
                  'relative flex flex-col gap-2 rounded-xl border-2 p-5 text-left transition-all hover:border-orange-400',
                  selectedPlan === plan.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'border-muted'
                )}
              >
                {selectedPlan === plan.id && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                <span className="font-semibold text-base">{plan.name}</span>
                <span className="text-2xl font-bold">€{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.description}</span>
              </button>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setSelectedPlan('free')}
                className={cn(
                  'relative flex flex-col gap-2 rounded-xl border-2 p-5 text-left transition-all col-span-2 hover:border-green-400',
                  selectedPlan === 'free'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-dashed border-muted'
                )}
              >
                {selectedPlan === 'free' && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Admin</span>
                <span className="font-semibold text-base">Free Spotlight</span>
                <span className="text-xs text-muted-foreground">Intern · Kein Enddatum · 30 km Umkreis</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Anzeigen-Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Anzeigen-Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Headline */}
            <div className="space-y-2">
              <Label htmlFor="headline">
                Headline <span className="text-destructive">*</span>
              </Label>
              <Input
                id="headline"
                placeholder='z. B. „Jetzt kostenlos registrieren"'
                maxLength={80}
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{formData.headline.length}/80</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Kurze Beschreibung deiner Anzeige..."
                maxLength={200}
                rows={3}
                className="resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{formData.description.length}/200</p>
            </div>

            {/* Englische Version (aufklappbar) */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEnglishFields(!showEnglishFields)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  🇬🇧 Englische Version
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', showEnglishFields && 'rotate-180')} />
              </button>
              {showEnglishFields && (
                <div className="p-4 space-y-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Wird angezeigt wenn Nutzer die App-Sprache auf Englisch gestellt haben.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="headlineEn">Headline (EN)</Label>
                    <Input
                      id="headlineEn"
                      placeholder='e.g. "Book your event venue now"'
                      maxLength={80}
                      value={formData.headlineEn}
                      onChange={(e) => setFormData({ ...formData, headlineEn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">Description (EN)</Label>
                    <Textarea
                      id="descriptionEn"
                      placeholder="Short description in English..."
                      maxLength={200}
                      rows={3}
                      className="resize-none"
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bild */}
            <div className="space-y-2">
              <Label>
                Bild <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Empfohlen: 1200×628 px · PNG oder JPG · max. 5 MB
              </p>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
                  <img src={imagePreview} alt="Vorschau" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-lg p-8 cursor-pointer hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                  <Upload className="h-8 w-8 text-orange-400" />
                  <span className="text-sm font-medium">Bild hochladen</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>

            {/* Zielregion */}
            <div className="space-y-2">
              <Label>
                Zielregion <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex-1 text-left border"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate text-sm">
                    {selectedLocation?.description || 'Standort wählen...'}
                  </span>
                </button>
                {selectedPlan && (
                  <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">
                    {selectedPlan === 'free' ? FREE_PLAN.radius : PLANS[selectedPlan as PlanId].radius} km
                  </span>
                )}
              </div>
              {selectedPlan && (
                <p className="text-xs text-muted-foreground">
                  Umkreis ist im {selectedPlan === 'free' ? FREE_PLAN.name : PLANS[selectedPlan as PlanId].name}-Plan auf {selectedPlan === 'free' ? FREE_PLAN.radius : PLANS[selectedPlan as PlanId].radius} km festgelegt.
                </p>
              )}
            </div>

            {/* Ziel-URL */}
            <div className="space-y-2">
              <Label htmlFor="targetUrl">
                Ziel-URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetUrl"
                type="url"
                placeholder="https://deine-website.at"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="gradient"
            className="flex-1"
            loading={isLoading}
            disabled={!selectedPlan}
          >
            <Megaphone className="h-4 w-4 mr-2" />
            Weiter zur Zahlung
          </Button>
        </div>
      </form>

      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelect={(loc) => setSelectedLocation(loc)}
        initialLocation={selectedLocation}
      />
    </div>
  )
}

