import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Pause, Calendar, MapPin, TrendingUp, Eye, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface BoostModalProps {
  eventId: string
  eventName: string
  boostStatus?: string
  boostDailyBudget?: number
  boostEndDate?: string
  boostRadius?: number
  boostImpressions?: number
  open: boolean
  onClose: () => void
}

function BoostPaymentForm({
  clientSecret,
  eventId,
  budget,
  days,
  radius,
  onSuccess,
  onBack,
}: {
  clientSecret: string
  eventId: string
  budget: number
  days: number
  radius: number
  onSuccess: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setIsLoading(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    })

    if (error) {
      toast({ variant: 'destructive', title: 'Zahlung fehlgeschlagen', description: error.message })
      setIsLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await apiClient.post(`/events/${eventId}/boost/activate`, { budget, days, radius })
        toast({ title: 'Boost aktiviert! 🚀', description: `Dein Event wird ${days} Tage lang beworben.` })
        onSuccess()
      } catch {
        toast({ variant: 'destructive', title: 'Fehler', description: 'Zahlung erfolgreich, aber Boost konnte nicht aktiviert werden. Bitte kontaktiere den Support.' })
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </button>

      <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Laufzeit</span>
          <span className="font-medium">{days} Tage</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Umkreis</span>
          <span className="font-medium">{radius} km</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Gesamt</span>
          <span>€{budget.toFixed(2)}</span>
        </div>
      </div>

      <PaymentElement />

      <Button
        variant="gradient"
        className="w-full"
        onClick={handleSubmit}
        disabled={!stripe || isLoading}
      >
        <Zap className="h-4 w-4 mr-2" />
        {isLoading ? 'Verarbeitung...' : `Jetzt bezahlen – €${budget.toFixed(2)}`}
      </Button>
    </div>
  )
}

export default function BoostModal({
  eventId,
  eventName,
  boostStatus,
  boostDailyBudget,
  boostEndDate,
  boostRadius,
  boostImpressions,
  open,
  onClose,
}: BoostModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState('7')
  const [radius, setRadius] = useState('25')
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const isActive = boostStatus === 'active'
  const budgetNum = parseFloat(budget) || 0
  const daysNum = parseInt(days) || 1
  const dailyBudget = budgetNum > 0 ? (budgetNum / daysNum).toFixed(2) : '0.00'
  const daysRemaining = boostEndDate
    ? Math.max(0, Math.ceil((new Date(boostEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const handleCreateIntent = async () => {
    if (budgetNum < 5) {
      toast({ variant: 'destructive', title: 'Mindestbudget', description: 'Das Mindestbudget beträgt €5.' })
      return
    }
    setIsLoading(true)
    try {
      const res = await apiClient.post(`/events/${eventId}/boost/intent`, {
        budget: budgetNum,
        days: daysNum,
        radius: parseInt(radius),
      })
      setClientSecret(res.data.data.clientSecret)
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Konnte Zahlung nicht initiieren.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = async () => {
    setIsLoading(true)
    try {
      await apiClient.post(`/events/${eventId}/boost/pause`)
      toast({ title: 'Boost pausiert', description: 'Dein Event wird nicht mehr beworben.' })
      queryClient.invalidateQueries({ queryKey: ['events', 'my-events'] })
      onClose()
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Boost konnte nicht pausiert werden.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['events', 'my-events'] })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {isActive ? 'Boost aktiv' : 'Event boosten'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mb-2">
          <p className="text-sm font-medium">{eventName}</p>
          {!isActive && !clientSecret && (
            <p className="text-xs text-muted-foreground">
              Dein Event erscheint ganz oben in den Suchergebnissen – vor allen organischen Ergebnissen.
            </p>
          )}
        </div>

        {isActive ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-semibold text-amber-600">Boost läuft</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tagesbudget</span>
                <span className="ml-auto font-medium">€{boostDailyBudget?.toFixed(2)}/Tag</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Impressionen</span>
                <span className="ml-auto font-medium">{boostImpressions ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Umkreis</span>
                <span className="ml-auto font-medium">{boostRadius} km</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Endet am</span>
                <span className="ml-auto font-medium">
                  {boostEndDate ? new Date(boostEndDate).toLocaleDateString('de-DE') : '–'}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 text-sm">
                <span>Verbleibend</span>
                <span>{daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={handlePause}
              disabled={isLoading}
            >
              <Pause className="h-4 w-4" />
              Boost pausieren
            </Button>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <BoostPaymentForm
              clientSecret={clientSecret}
              eventId={eventId}
              budget={budgetNum}
              days={daysNum}
              radius={parseInt(radius)}
              onSuccess={handlePaymentSuccess}
              onBack={() => setClientSecret(null)}
            />
          </Elements>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Budget (€)</Label>
              <Input
                type="number"
                min={5}
                step={1}
                placeholder="z.B. 20"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mindestbudget: €5</p>
            </div>
            <div className="space-y-2">
              <Label>Laufzeit</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Tag</SelectItem>
                  <SelectItem value="3">3 Tage</SelectItem>
                  <SelectItem value="7">7 Tage</SelectItem>
                  <SelectItem value="14">14 Tage</SelectItem>
                  <SelectItem value="30">30 Tage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Umkreis</Label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {budgetNum >= 5 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tagesbudget</span>
                  <span className="font-medium">€{dailyBudget}/Tag</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Laufzeit</span>
                  <span className="font-medium">{days} Tage</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Umkreis</span>
                  <span className="font-medium">{radius} km</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                  <span>Gesamt</span>
                  <span>€{budgetNum.toFixed(2)}</span>
                </div>
              </div>
            )}
            <Button
              variant="gradient"
              className="w-full"
              onClick={handleCreateIntent}
              disabled={budgetNum < 5 || isLoading}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isLoading ? 'Wird geladen...' : `Boost starten – €${budgetNum > 0 ? budgetNum.toFixed(2) : '0.00'}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
