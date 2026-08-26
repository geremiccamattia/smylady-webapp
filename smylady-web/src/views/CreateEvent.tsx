'use client'

import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { isHeicFile } from '@/lib/heic'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useGetConnectedAccount } from '@/hooks/useStripe'
import { eventsService } from '@/services/events'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Upload,
  X,
  Calendar,
  MapPin,
  Info,
  Users,
  Globe,
  UserPlus,
  Loader2,
  Repeat,
  Plus,
  Trash2,
  Languages,
  Gift,
} from 'lucide-react'
import RecurringEventModal from '@/components/events/RecurringEventModal'
import { SubscriberPicker } from '@/components/events/SubscriberPicker'
import { RaffleSettingsFields } from '@/components/events/RaffleSettingsFields'

// Event visibility types (same as mobile app)
type EventVisibility = 'public' | 'subscribers' | 'selected'

function CreateEventContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const communityIdFromUrl = searchParams.get('communityId')
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { data: connectedAccount } = useGetConnectedAccount()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [step, setStep] = useState(1)

  // Visibility state (matching mobile app)
  const [visibility, setVisibility] = useState<EventVisibility>('public')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])

  const userId = user?._id || user?.id

  const [useTiers, setUseTiers] = useState(false)
  const [payAtDoor, setPayAtDoor] = useState(false)
  const [isRaffle, setIsRaffle] = useState(false)
  const [rafflePrize, setRafflePrize] = useState('')
  const [raffleDrawDate, setRaffleDrawDate] = useState('')
  const [raffleDrawOnSite, setRaffleDrawOnSite] = useState(false)
  const [raffleNotifyWinnerByEmail, setRaffleNotifyWinnerByEmail] = useState(false)
  const [rafflePartner, setRafflePartner] = useState('')
  const [rafflePartnerMarketing, setRafflePartnerMarketing] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [seriesConfig, setSeriesConfig] = useState<{
    recurrence: string
    occurrences?: number
    customDates?: string[]
    customLabel?: string
  } | null>(null)
  const [ticketTiers, setTicketTiers] = useState([
    { name: '', description: '', price: '', quantity: '' },
  ])

  const [questions, setQuestions] = useState<Array<{
    questionId: string
    label: string
    type: 'text' | 'select' | 'checkbox' | 'multiselect'
    required: boolean
    options: string[]
  }>>([])

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { questionId: `q_${Date.now()}_${prev.length}`, label: '', type: 'text', required: true, options: [] },
    ])
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const updateQuestion = (
    idx: number,
    patch: Partial<{ label: string; type: 'text' | 'select' | 'checkbox' | 'multiselect'; required: boolean; options: string[] }>,
  ) => {
    setQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  const EVENT_CATEGORIES = [
    { value: 'Music', label: t('categories.music', { defaultValue: 'Musik' }) },
    { value: 'Gastronomy', label: t('categories.gastronomy', { defaultValue: 'Gastronomie' }) },
    { value: 'Nature', label: t('categories.outdoor', { defaultValue: 'Outdoor' }) },
    { value: 'Business', label: t('categories.business', { defaultValue: 'Business' }) },
    { value: 'On the Roof', label: t('categories.onTheRoof', { defaultValue: 'Auf dem Dach' }) },
    { value: 'Theme', label: t('categories.theme', { defaultValue: 'Themen-Event' }) },
    { value: 'Sports', label: t('categories.sports', { defaultValue: 'Sport' }) },
    { value: 'Clubbing', label: t('categories.clubbing', { defaultValue: 'Clubbing' }) },
    { value: 'Other', label: t('categories.other', { defaultValue: 'Sonstiges' }) },
    { value: 'Workshop', label: t('categories.workshop', { defaultValue: 'Workshop' }) },
  ]

  const PARTY_TYPES = [
    { value: 'birthday', label: t('partyTypes.birthday', { defaultValue: 'Geburtstag' }) },
    { value: 'wedding', label: t('partyTypes.wedding', { defaultValue: 'Hochzeit' }) },
    { value: 'corporate', label: t('partyTypes.corporate', { defaultValue: 'Firmenfeier' }) },
    { value: 'social', label: t('partyTypes.social', { defaultValue: 'Treffen' }) },
    { value: 'other', label: t('partyTypes.other', { defaultValue: 'Sonstiges' }) },
  ]

  const MUSIC_TYPES = [
    { value: 'electronic', label: t('musicTypes.electronic', { defaultValue: 'Electronic' }) },
    { value: 'rock', label: t('musicTypes.rock', { defaultValue: 'Rock' }) },
    { value: 'pop', label: t('musicTypes.pop', { defaultValue: 'Pop' }) },
    { value: 'hip_hop', label: t('musicTypes.hipHop', { defaultValue: 'Hip Hop' }) },
    { value: 'classical', label: t('musicTypes.classical', { defaultValue: 'Klassik' }) },
    { value: 'jazz', label: t('musicTypes.jazz', { defaultValue: 'Jazz' }) },
    { value: 'other', label: t('musicTypes.other', { defaultValue: 'Sonstiges' }) },
  ]

  const OFFERINGS = [
    { value: 'none', label: t('offerings.none', { defaultValue: 'Keine' }) },
    { value: 'pool', label: t('offerings.pool', { defaultValue: 'Pool' }) },
    { value: 'food_drinks', label: t('offerings.foodDrinks', { defaultValue: 'Essen & Trinken' }) },
    { value: 'terrasse', label: t('offerings.terrace', { defaultValue: 'Terrasse' }) },
    { value: 'grill', label: t('offerings.grill', { defaultValue: 'Grill' }) },
    { value: 'feuerstelle', label: t('offerings.fireplace', { defaultValue: 'Feuerstelle' }) },
    { value: 'drinks', label: t('offerings.drinks', { defaultValue: 'Getränke' }) },
    { value: 'other', label: t('offerings.other', { defaultValue: 'Sonstiges' }) },
  ]

  const VISIBILITY_OPTIONS = [
    {
      value: 'public' as EventVisibility,
      label: 'Public',
      description: 'Everyone can see this event',
      icon: Globe,
    },
    {
      value: 'subscribers' as EventVisibility,
      label: 'Subscribers Only',
      description: 'Only your subscribers can see this event',
      icon: Users,
    },
    {
      value: 'selected' as EventVisibility,
      label: 'Selected People',
      description: 'Only selected subscribers can see this event',
      icon: UserPlus,
    },
  ]

  const addTier = () => {
    setTicketTiers(prev => [...prev, { name: '', description: '', price: '', quantity: '' }])
  }

  const removeTier = (index: number) => {
    if (ticketTiers.length <= 1) return
    setTicketTiers(prev => prev.filter((_, i) => i !== index))
  }

  const updateTier = (index: number, field: string, value: string) => {
    setTicketTiers(prev => prev.map((tier, i) => i === index ? { ...tier, [field]: value } : tier))
  }

  const handleUseTiersChange = (checked: boolean) => {
    setUseTiers(checked)
    if (checked) {
      setTicketTiers([{ name: '', description: '', price: '', quantity: '' }])
    }
  }

  const [formData, setFormData] = useState({
    // Step 1 fields (matching mobile StepOne)
    eventDate: '',
    eventStartTime: '',
    eventEndTime: '',
    locationName: '',
    lat: 0,
    lng: 0,
    totalTickets: '',
    partyType: '',
    category: '',
    musicType: '',
    offerings: '',
    // Step 2 fields (matching mobile StepTwo)
    name: '',
    description: '',
    restrictions: '',
    minimumAge: '',
    price: '',
  })

  const [allowGuestMemories, setAllowGuestMemories] = useState(true)
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTimeValue, setEventEndTimeValue] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translatedPreview, setTranslatedPreview] = useState<{
    lang: string; name: string; description: string; restrictions: string
  } | null>(null)

  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<
    Array<{ place_id: number; display_name: string; lat: string; lon: string }>
  >([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationSearchRef = useRef<HTMLDivElement>(null)
  const [addressDetail, setAddressDetail] = useState('')
  const [locationType, setLocationType] = useState<'physical' | 'online' | 'tba'>('physical')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [tbaCityQuery, setTbaCityQuery] = useState('')
  const [tbaCityResults, setTbaCityResults] = useState<Array<{ name: string; lat: number; lng: number }>>([])
  const [selectedTbaCity, setSelectedTbaCity] = useState<{ name: string; lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.trim().length < 3) {
      setLocationResults([])
      setShowLocationDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5&addressdetails=1&countrycodes=at,de`
        )
        const data = await res.json()
        setLocationResults(data)
        setShowLocationDropdown(data.length > 0)
      } catch {
        // silently fail
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [locationQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (locationType !== 'tba' || tbaCityQuery.trim().length < 2) {
      setTbaCityResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(tbaCityQuery)}&limit=5&featuretype=city&addressdetails=1&countrycodes=at,de,ch`
        )
        const data = await res.json()
        const cities = data.map((r: any) => ({
          name: [r.address?.city || r.address?.town || r.name, r.address?.country].filter(Boolean).join(', '),
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
        setTbaCityResults(cities)
      } catch {
        setTbaCityResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [tbaCityQuery, locationType])

  // Komprimiert + übernimmt eine fertige Datei (gecroppt ODER — bei HEIC —
  // unverändert). Reine Übernahme-Logik ohne Warteschlangen-Fortsetzung,
  // damit sie sowohl vom Cropper-Callback als auch vom HEIC-Bypass in
  // drainImageQueue verwendet werden kann.
  const finalizeImage = async (file: File) => {
    let fileToUse = file
    // HEIC-Bypass: unveränderte Originaldatei, keine Kompression versuchen —
    // browser-image-compression zeichnet intern auf Canvas und kann HEIC
    // ebenso wenig dekodieren wie der Cropper.
    if (!(await isHeicFile(file))) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
        const safeName = file.name && file.name !== ''
          ? file.name.replace(/\.(heic|heif)$/i, '.jpg')
          : `image_${Date.now()}.jpg`
        const safeType = compressed.type === 'image/heic' || compressed.type === 'image/heif'
          ? 'image/jpeg'
          : compressed.type
        fileToUse = new File([compressed], safeName, { type: safeType })
      } catch {
        console.warn('Image compression failed, using original')
      }
    }

    setImages((prev) => [...prev, fileToUse])

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews((prev) => [...prev, reader.result as string])
    }
    reader.readAsDataURL(fileToUse)
  }

  // Arbeitet eine Warteschlange ausgewählter Bilder ab: HEIC-Dateien werden
  // ohne Crop-Dialog direkt übernommen (Backend konvertiert sie zuverlässig),
  // das erste Bild, das tatsächlich gecroppt werden kann, öffnet den Cropper.
  // WICHTIG: `queue` läuft als Parameter durch, nicht über die pendingFiles-
  // State gelesen — sonst stale closure, da setPendingFiles() erst beim
  // nächsten Render sichtbar wird, wir hier aber ggf. noch im selben Tick
  // (nach einem await) weiterlesen würden.
  const drainImageQueue = async (queue: File[]) => {
    for (let i = 0; i < queue.length; i++) {
      const file = queue[i]
      if (await isHeicFile(file)) {
        toast({
          title: t('imageCrop.heicSkipCrop', {
            defaultValue: 'Dieses Bildformat kann im Browser nicht zugeschnitten werden. Das Bild wird unverändert hochgeladen und automatisch umgewandelt.',
          }),
        })
        await finalizeImage(file)
        continue
      }
      setPendingFiles(queue.slice(i + 1))
      const imageUrl = URL.createObjectURL(file)
      setSelectedImageUrl(imageUrl)
      setCropModalOpen(true)
      return
    }
    // Warteschlange komplett abgearbeitet (nur HEIC oder leer) — Dialog bleibt zu.
    setCropModalOpen(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('createEvent.maxImages'),
      })
      return
    }

    if (e.target) {
      e.target.value = ''
    }

    if (files.length > 0) {
      drainImageQueue(files)
    }
  }

  const handleCropComplete = async (croppedFile: File) => {
    await finalizeImage(croppedFile)

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }

    if (pendingFiles.length > 0) {
      // pendingFiles ist hier sicher aktuell: handleCropComplete wird als
      // Modal-Callback erst nach echter Nutzerinteraktion aufgerufen — der
      // State ist zu diesem Zeitpunkt längst committed.
      await drainImageQueue(pendingFiles)
    } else {
      setCropModalOpen(false)
    }
  }

  const handleCropClose = () => {
    setCropModalOpen(false)
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
    setPendingFiles([])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const validateStep1 = () => {
    if (!formData.eventDate) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.selectDate') })
      return false
    }
    if (!formData.eventStartTime) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.selectStartTime') })
      return false
    }
    if (locationType === 'physical' && (!formData.locationName || formData.lat === 0 || formData.lng === 0)) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.enterLocation') })
      return false
    }
    if (!useTiers && !formData.totalTickets) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.enterGuestCount') })
      return false
    }
    if (!formData.partyType) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.selectPartyType') })
      return false
    }
    if (!formData.category) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.selectCategory') })
      return false
    }
    if (!formData.musicType) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.selectMusicType') })
      return false
    }
    if (!formData.offerings) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.selectOfferings') })
      return false
    }
    return true
  }

  const hasPaidTickets = () => {
    if (isRaffle) return false
    if (payAtDoor) return false
    if (useTiers) {
      return ticketTiers.some(t => parseFloat(t.price) > 0)
    }
    return parseFloat(formData.price) > 0
  }

  const validateStep2 = () => {
    if (!formData.name) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.enterEventName') })
      return false
    }
    if (!formData.description) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.enterDescription') })
      return false
    }
    if (isRaffle && !rafflePrize.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('createEvent.rafflePrize', { defaultValue: 'Was gibt es zu gewinnen?' }),
      })
      return false
    }
    const stripeReady = connectedAccount && connectedAccount.accountStatus === 'active'
    if (hasPaidTickets() && !stripeReady) {
      toast({
        variant: 'destructive',
        title: 'Stripe nicht verbunden',
        description: 'Um bezahlte Events zu erstellen, musst du zuerst Stripe in deinen Einstellungen verbinden.',
        action: (
          <ToastAction altText="Zu den Einstellungen" onClick={() => router.push('/settings')}>
            Einstellungen
          </ToastAction>
        ),
      })
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleTranslate = async () => {
    if (!formData.name && !formData.description) return
    setTranslating(true)
    try {
      const currentLang = i18n.language?.substring(0, 2) || 'de'
      const targetLang = currentLang === 'de' ? 'EN' : 'DE'
      const result = await eventsService.translateText(
        {
          name: formData.name,
          description: formData.description,
          restrictions: formData.restrictions || '',
        },
        targetLang as 'DE' | 'EN',
      )
      setTranslatedPreview({
        lang: targetLang.toLowerCase(),
        name: result.translated.name,
        description: result.translated.description,
        restrictions: result.translated.restrictions,
      })
      toast({
        title: targetLang === 'EN' ? 'Auf Englisch übersetzt' : 'Auf Deutsch übersetzt',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: error?.response?.data?.message || 'Übersetzung fehlgeschlagen',
      })
    } finally {
      setTranslating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (locationType === 'tba' && !selectedTbaCity) {
      toast({
        variant: 'destructive',
        title: t('createEvent.tbaCityRequired', { defaultValue: 'Bitte wähle eine Stadt aus' }),
      })
      return
    }

    if (images.length === 0) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('createEvent.addImage'),
      })
      return
    }

    const stripeReady = connectedAccount && connectedAccount.accountStatus === 'active'
    if (hasPaidTickets() && !stripeReady) {
      toast({
        variant: 'destructive',
        title: 'Stripe nicht verbunden',
        description: 'Um bezahlte Events zu erstellen, musst du zuerst Stripe in deinen Einstellungen verbinden.',
        action: (
          <ToastAction altText="Zu den Einstellungen" onClick={() => router.push('/settings')}>
            Einstellungen
          </ToastAction>
        ),
      })
      return
    }

    setIsLoading(true)

    try {
      const eventFormData = new FormData()

      // Build event date/time like mobile app
      const eventDate = new Date(formData.eventDate + 'T00:00:00')
      const [startHours, startMinutes] = formData.eventStartTime.split(':').map(Number)
      const eventStartTime = new Date(eventDate)
      eventStartTime.setHours(startHours, startMinutes, 0, 0)

      let eventEndTime = new Date(eventDate)
      if (formData.eventEndTime) {
        const [endHours, endMinutes] = formData.eventEndTime.split(':').map(Number)
        eventEndTime.setHours(endHours, endMinutes, 0, 0)
        // Handle case where end time is past midnight
        if (eventEndTime <= eventStartTime) {
          eventEndTime.setDate(eventEndTime.getDate() + 1)
        }
      } else {
        // Default end time 4 hours after start
        eventEndTime = new Date(eventStartTime.getTime() + 4 * 60 * 60 * 1000)
      }

      // Mehrtägiges Event: Enddatum überschreibt die einfache Uhrzeit-Berechnung oben
      if (isMultiDay && eventEndDate) {
        const multiDayEnd = new Date(eventEndDate + 'T00:00:00')
        if (eventEndTimeValue) {
          const [endHours, endMinutes] = eventEndTimeValue.split(':').map(Number)
          multiDayEnd.setHours(endHours, endMinutes, 0, 0)
        } else {
          multiDayEnd.setHours(23, 59, 0, 0)
        }
        eventEndTime = multiDayEnd
      }

      // Add all form fields
      eventFormData.append('name', formData.name)
      eventFormData.append('description', formData.description)
      eventFormData.append('eventDate', eventDate.toISOString())
      eventFormData.append('eventStartTime', eventStartTime.toISOString())
      eventFormData.append('eventEndTime', eventEndTime.toISOString())
      eventFormData.append('locationType', locationType)
      if (locationType === 'online') {
        eventFormData.append('locationName', 'Online')
      } else if (locationType === 'tba') {
        if (selectedTbaCity) {
          eventFormData.append('locationName', `${selectedTbaCity.name} — Standort folgt`)
          eventFormData.append('location', JSON.stringify({
            type: 'Point',
            coordinates: [selectedTbaCity.lng, selectedTbaCity.lat],
          }))
        } else {
          eventFormData.append('locationName', 'Standort folgt')
        }
      }
      if (locationType === 'physical') {
        const fullLocationName = addressDetail.trim()
          ? `${formData.locationName} Top ${addressDetail.trim()}`
          : formData.locationName
        eventFormData.append('locationName', fullLocationName)
      }
      if (onlineUrl) {
        eventFormData.append('onlineUrl', onlineUrl)
      }
      eventFormData.append('partyType', formData.partyType)
      eventFormData.append('category', formData.category)
      eventFormData.append('musicType', formData.musicType)
      eventFormData.append('offerings', formData.offerings)
      eventFormData.append('restrictions', formData.restrictions || '')
      eventFormData.append('minimumAge', formData.minimumAge || '0')

      if (useTiers && ticketTiers.length > 0) {
        const validTiers = ticketTiers.filter(t => t.name && t.price !== '')
        if (validTiers.length === 0) {
          toast({ variant: 'destructive', title: t('common.error'), description: t('createEvent.ticketValidationError', { defaultValue: 'Bitte mindestens einen Tickettyp mit Name und Preis anlegen.' }) })
          setIsLoading(false)
          return
        }
        const tiersPayload = validTiers.map(t => ({
          name: t.name,
          description: t.description,
          price: parseFloat(t.price) || 0,
          ...(t.quantity ? { quantity: parseInt(t.quantity) } : {}),
        }))
        eventFormData.append('ticketTiers', JSON.stringify(tiersPayload))
        eventFormData.append('price', '0')        // backend will override with min tier price
        eventFormData.append('totalTickets', '1') // backend will override with sum of quantities
      } else {
        if (isRaffle) {
          eventFormData.append('price', '0') // Immer kostenlos
        } else {
          eventFormData.append('price', String(parseFloat(formData.price) || 0))
        }
        eventFormData.append('totalTickets', String(parseInt(formData.totalTickets) || 0))
      }

      if (isRaffle) {
        eventFormData.append('isRaffle', 'true')
        eventFormData.append('rafflePrize', rafflePrize)
        if (raffleDrawDate) {
          eventFormData.append('raffleDrawDate', new Date(raffleDrawDate).toISOString())
        }
        // Bestimmen den Wortlaut der Teilnahmebedingungen
        eventFormData.append('raffleDrawOnSite', String(raffleDrawOnSite))
        eventFormData.append('raffleNotifyWinnerByEmail', String(raffleNotifyWinnerByEmail))
        eventFormData.append('rafflePartner', rafflePartner.trim())
        eventFormData.append(
          'rafflePartnerMarketing',
          String(rafflePartner.trim() ? rafflePartnerMarketing : false),
        )
      }

      const validQuestions = questions
        .filter(q => q.label.trim() !== '')
        .map(q => ({
          questionId: q.questionId,
          label: q.label.trim(),
          type: q.type,
          required: q.required,
          options: (q.type === 'select' || q.type === 'multiselect')
            ? q.options.map(o => o.trim()).filter(o => o !== '')
            : [],
        }))
      if (validQuestions.length > 0) {
        eventFormData.append('questions', JSON.stringify(validQuestions))
      }

      if (translatedPreview) {
        const sourceLang = i18n.language?.substring(0, 2) || 'de'
        const translations: any = {}
        translations[translatedPreview.lang] = {
          name: translatedPreview.name,
          description: translatedPreview.description,
          restrictions: translatedPreview.restrictions,
        }
        translations[sourceLang] = {
          name: formData.name,
          description: formData.description,
          restrictions: formData.restrictions || '',
        }
        eventFormData.append('translations', JSON.stringify(translations))
      }

      // Add visibility settings (matching mobile app)
      eventFormData.append('visibility', visibility)
      if (visibility === 'selected' && invitedUsers.length > 0) {
        eventFormData.append('invitedUsers', JSON.stringify(invitedUsers))
      }
      eventFormData.append('allowGuestMemories', String(allowGuestMemories))
      eventFormData.append('paymentType', payAtDoor ? 'door' : 'online')
      if (isAiGenerated) {
        eventFormData.append('isAiGenerated', 'true')
      }

      if (locationType === 'physical') {
        eventFormData.append(
          'location',
          JSON.stringify({
            type: 'Point',
            coordinates: [formData.lng, formData.lat],
          })
        )
      }

      // Add images
      images.forEach((image) => {
        eventFormData.append('files', image)
      })

      if (communityIdFromUrl) {
        eventFormData.append('communityId', communityIdFromUrl)
      }

      if (seriesConfig) {
        eventFormData.append('series', JSON.stringify(seriesConfig))
        await eventsService.createEventSeries(eventFormData)
      } else {
        await eventsService.createEvent(eventFormData)
      }

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'create_event' })

      // No toast shown here - user will receive push notification about event approval status
      router.push('/my-events')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err.response?.data?.message || t('createEvent.createFailed'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('events.createEvent')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('createEvent.fillInfo')}
        </p>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('createEvent.stepOf', { current: step, total: 3 })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Info (matching mobile StepOne) */}
        {step === 1 && (
          <>
            {/* Visibility Selector (matching mobile VisibilitySelector) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('createEvent.whoCanSee')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        visibility === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <option.icon
                          className={`h-5 w-5 ${
                            visibility === option.value ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            visibility === option.value ? 'border-primary' : 'border-muted-foreground'
                          }`}
                        >
                          {visibility === option.value && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                      <p
                        className={`font-medium text-sm ${
                          visibility === option.value ? 'text-primary' : ''
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  ))}
                </div>

                {/* Select Subscribers Button (matching mobile) */}
                {visibility === 'selected' && (
                  <SubscriberPicker
                    userId={userId}
                    value={invitedUsers}
                    onChange={setInvitedUsers}
                    className="mt-4 w-full"
                  />
                )}
              </CardContent>
            </Card>

            {/* Date & Time (matching mobile) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('createEvent.whenParty')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">{t('events.date')} *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventStartTime">{t('createEvent.eventTime')} *</Label>
                    <Input
                      id="eventStartTime"
                      type="time"
                      value={formData.eventStartTime}
                      onChange={(e) => setFormData({ ...formData, eventStartTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventEndTime">{t('createEvent.until')}</Label>
                    <Input
                      id="eventEndTime"
                      type="time"
                      value={formData.eventEndTime}
                      onChange={(e) => setFormData({ ...formData, eventEndTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    id="multiDay"
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked)
                      if (!e.target.checked) {
                        setEventEndDate('')
                        setEventEndTimeValue('')
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="multiDay">
                    {t('createEvent.multiDay', { defaultValue: 'Mehrtägiges Event' })}
                  </Label>
                </div>

                {isMultiDay && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2">
                      <Label htmlFor="eventEndDate">{t('createEvent.endDate', { defaultValue: 'Enddatum' })} *</Label>
                      <Input
                        id="eventEndDate"
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        min={formData.eventDate || undefined}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventEndDateTime">{t('createEvent.endTime', { defaultValue: 'Endzeit' })}</Label>
                      <Input
                        id="eventEndDateTime"
                        type="time"
                        value={eventEndTimeValue}
                        onChange={(e) => setEventEndTimeValue(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wiederkehrendes Event */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {t('createEvent.recurringEvent', { defaultValue: 'Wiederkehrendes Event' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seriesConfig
                        ? seriesConfig.recurrence === 'custom'
                          ? seriesConfig.customLabel
                          : seriesConfig.recurrence === 'weekly'
                          ? t('createEvent.weeklyX', { defaultValue: 'Wöchentlich · {{count}}x', count: seriesConfig.occurrences })
                          : t('createEvent.monthlyX', { defaultValue: 'Monatlich · {{count}}x', count: seriesConfig.occurrences })
                        : t('createEvent.oneTime', { defaultValue: 'Einmalig' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {seriesConfig && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSeriesConfig(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowRecurringModal(true)}
                      disabled={!formData.eventDate}
                    >
                      <Repeat className="h-4 w-4" />
                      {seriesConfig
                        ? t('common.edit', { defaultValue: 'Ändern' })
                        : t('createEvent.setup', { defaultValue: 'Einrichten' })}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <RecurringEventModal
              open={showRecurringModal}
              onClose={() => setShowRecurringModal(false)}
              onConfirm={setSeriesConfig}
              baseDate={formData.eventDate}
            />

            {/* Location (matching mobile) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('createEvent.whereParty')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('createEvent.locationType', { defaultValue: 'Veranstaltungsort' })}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={locationType === 'physical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocationType('physical')}
                    >
                      📍 {t('createEvent.locationPhysical', { defaultValue: 'Vor Ort' })}
                    </Button>
                    <Button
                      type="button"
                      variant={locationType === 'online' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocationType('online')}
                    >
                      💻 {t('createEvent.locationOnline', { defaultValue: 'Online' })}
                    </Button>
                    <Button
                      type="button"
                      variant={locationType === 'tba' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocationType('tba')}
                    >
                      📌 {t('createEvent.locationTba', { defaultValue: 'Standort folgt' })}
                    </Button>
                  </div>
                </div>

                {locationType === 'physical' && (
                  <div className="space-y-2" ref={locationSearchRef}>
                    <Label htmlFor="locationName">{t('events.location')} *</Label>
                    <div className="relative">
                      <Input
                        id="locationName"
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value)
                          setFormData({ ...formData, locationName: '', lat: 0, lng: 0 })
                        }}
                        placeholder={t('createEvent.enterLocation')}
                        autoComplete="off"
                      />
                      {showLocationDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {locationResults.map((result) => (
                            <button
                              key={result.place_id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  locationName: result.display_name,
                                  lat: parseFloat(result.lat),
                                  lng: parseFloat(result.lon),
                                })
                                setLocationQuery(result.display_name)
                                setShowLocationDropdown(false)
                              }}
                            >
                              {result.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder={t('createEvent.addressDetail', {
                        defaultValue: 'Adresszusatz (z.B. Stiege 2, Top 5) — optional',
                      })}
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {locationType === 'online' && (
                  <div className="space-y-2">
                    <Label>{t('createEvent.onlineUrl', { defaultValue: 'Link zum Event (optional)' })}</Label>
                    <Input
                      type="url"
                      placeholder="https://zoom.us/j/... oder https://meet.google.com/..."
                      value={onlineUrl}
                      onChange={(e) => setOnlineUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('createEvent.onlineUrlHint', { defaultValue: 'Den Link können Teilnehmer nach dem Ticketkauf sehen.' })}
                    </p>
                  </div>
                )}

                {locationType === 'tba' && (
                  <div className="space-y-2">
                    <Label>{t('createEvent.tbaCity', { defaultValue: 'In welcher Stadt findet das Event statt?' })}</Label>
                    <div className="relative">
                      <Input
                        placeholder={t('createEvent.searchCity', { defaultValue: 'Stadt eingeben...' })}
                        value={selectedTbaCity ? selectedTbaCity.name : tbaCityQuery}
                        onChange={(e) => {
                          setTbaCityQuery(e.target.value)
                          setSelectedTbaCity(null)
                        }}
                        onFocus={() => {
                          if (selectedTbaCity) {
                            setTbaCityQuery(selectedTbaCity.name)
                            setSelectedTbaCity(null)
                          }
                        }}
                      />
                      {tbaCityResults.length > 0 && !selectedTbaCity && (
                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {tbaCityResults.map((city, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                              onClick={() => {
                                setSelectedTbaCity(city)
                                setTbaCityQuery('')
                                setTbaCityResults([])
                              }}
                            >
                              📍 {city.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('createEvent.tbaHint', { defaultValue: 'Du kannst den genauen Standort später über "Event bearbeiten" ergänzen.' })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Number of Guests (matching mobile) */}
            {!useTiers && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="totalTickets">{t('createEvent.guestsLabel')} *</Label>
                    <Input
                      id="totalTickets"
                      type="number"
                      min="1"
                      value={formData.totalTickets}
                      onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                      placeholder={t('createEvent.enterGuestCount')}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dropdowns (matching mobile dropdowns) */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Party Type */}
                <div className="space-y-2">
                  <Label htmlFor="partyType">{t('createEvent.partyTypeLabel')}</Label>
                  <select
                    id="partyType"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={formData.partyType}
                    onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}
                    required
                  >
                    <option value="">{t('createEvent.clickToSelect')}</option>
                    {PARTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">{t('createEvent.categoryLabel')}</Label>
                  <select
                    id="category"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">{t('createEvent.clickToSelect')}</option>
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Music Type */}
                <div className="space-y-2">
                  <Label htmlFor="musicType">{t('createEvent.musicTypeLabel')}</Label>
                  <select
                    id="musicType"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={formData.musicType}
                    onChange={(e) => setFormData({ ...formData, musicType: e.target.value })}
                    required
                  >
                    <option value="">{t('createEvent.clickToSelect')}</option>
                    {MUSIC_TYPES.map((music) => (
                      <option key={music.value} value={music.value}>
                        {music.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Offerings */}
                <div className="space-y-2">
                  <Label htmlFor="offerings">{t('createEvent.offeringsLabel')}</Label>
                  <select
                    id="offerings"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={formData.offerings}
                    onChange={(e) => setFormData({ ...formData, offerings: e.target.value })}
                    required
                  >
                    <option value="">{t('createEvent.clickToSelect')}</option>
                    {OFFERINGS.map((offering) => (
                      <option key={offering.value} value={offering.value}>
                        {offering.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label>{t('createEvent.allowGuestPhotos', { defaultValue: 'Gäste dürfen Fotos hochladen' })}</Label>
                  <button
                    type="button"
                    onClick={() => setAllowGuestMemories(!allowGuestMemories)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      allowGuestMemories ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowGuestMemories ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Details (matching mobile StepTwo) */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {t('createEvent.eventDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Party Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('createEvent.partyName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('createEvent.partyNamePlaceholder')}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('events.description')} *</Label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder={t('createEvent.addDetails')}
                />
              </div>

              {/* Translation */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleTranslate}
                  disabled={translating || (!formData.name && !formData.description)}
                >
                  <Languages className="h-4 w-4" />
                  {translating
                    ? t('createEvent.translating', { defaultValue: 'Übersetze...' })
                    : t('createEvent.translateBtn', { defaultValue: 'Automatisch übersetzen (DE ↔ EN)' })}
                </Button>

                {translatedPreview && (
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    <p className="text-sm font-medium">
                      {translatedPreview.lang === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch'}
                    </p>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {t('events.name', { defaultValue: 'Eventname' })}
                      </Label>
                      <Input
                        value={translatedPreview.name}
                        onChange={(e) => setTranslatedPreview({ ...translatedPreview, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {t('events.description', { defaultValue: 'Beschreibung' })}
                      </Label>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background resize-y text-sm"
                        value={translatedPreview.description}
                        onChange={(e) => setTranslatedPreview({ ...translatedPreview, description: e.target.value })}
                      />
                    </div>

                    {translatedPreview.restrictions && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t('createEvent.restrictions', { defaultValue: 'Einschränkungen' })}
                        </Label>
                        <Input
                          value={translatedPreview.restrictions}
                          onChange={(e) => setTranslatedPreview({ ...translatedPreview, restrictions: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Restrictions */}
              <div className="space-y-2">
                <Label htmlFor="restrictions">{t('createEvent.restrictions')}</Label>
                <Input
                  id="restrictions"
                  value={formData.restrictions}
                  onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                  placeholder={t('createEvent.addRestrictions')}
                />
              </div>

              {/* Minimum Age */}
              <div className="space-y-2">
                <Label htmlFor="minimumAge">{t('createEvent.minimumAge')}</Label>
                <Input
                  id="minimumAge"
                  type="number"
                  min="0"
                  value={formData.minimumAge}
                  onChange={(e) => setFormData({ ...formData, minimumAge: e.target.value })}
                  placeholder={t('createEvent.minimumAgePlaceholder')}
                />
              </div>

              {/* Abendkasse Toggle */}
              <div className="flex items-center justify-between py-2 px-4 bg-muted/40 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">
                    {t('createEvent.doorPayment', { defaultValue: 'Tickets an der Abendkasse zahlen' })}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('createEvent.doorPaymentDesc', { defaultValue: 'Gäste reservieren ihren Platz und zahlen vor Ort' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayAtDoor(!payAtDoor)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    payAtDoor ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    payAtDoor ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Tickets & Pricing */}
              {!payAtDoor && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="useTiers"
                      checked={useTiers}
                      onChange={(e) => handleUseTiersChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="useTiers">{t('createEvent.multipleTicketTypes', { defaultValue: 'Mehrere Tickettypen' })}</Label>
                  </div>

                  {!useTiers && !isRaffle && (
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('createEvent.setPrice')}</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder={t('createEvent.pricePlaceholder', { defaultValue: '0.00 (kostenlos)' })}
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('createEvent.priceHint', { defaultValue: 'Lasse das Feld leer oder gib 0 ein für ein kostenloses Event' })}
                      </p>
                    </div>
                  )}

                  {useTiers && (
                <div className="space-y-4">
                  {ticketTiers.map((tier, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t('createEvent.ticketType', { defaultValue: 'Tickettyp' })} {index + 1}</span>
                        {ticketTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Entfernen
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={tier.name}
                          onChange={(e) => updateTier(index, 'name', e.target.value)}
                          placeholder={t('createEvent.ticketNamePlaceholder', { defaultValue: 'z.B. Standard, VIP, Early Bird' })}
                          required={useTiers}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('createEvent.ticketDescription', { defaultValue: 'Beschreibung' })}</Label>
                        <Input
                          value={tier.description}
                          onChange={(e) => updateTier(index, 'description', e.target.value)}
                          placeholder={t('createEvent.ticketDescPlaceholder', { defaultValue: 'Kurze Beschreibung dieses Tickettyps' })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>{t('createEvent.ticketPrice', { defaultValue: 'Preis (€) *' })}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => updateTier(index, 'price', e.target.value)}
                            placeholder="0.00"
                            required={useTiers}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('createEvent.ticketQuantity', { defaultValue: 'Menge' })}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={tier.quantity}
                            onChange={(e) => updateTier(index, 'quantity', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(() => {
                    const tiersWithQuantity = ticketTiers.filter(t => t.quantity !== '')
                    const allHaveQuantity = ticketTiers.length > 0 && tiersWithQuantity.length === ticketTiers.length
                    if (!allHaveQuantity) return null
                    const total = tiersWithQuantity.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)
                    return (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                        <span className="text-muted-foreground">Gesamtanzahl Tickets (automatisch berechnet)</span>
                        <span className="font-semibold">{total}</span>
                      </div>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={addTier}
                    className="w-full py-2 border-2 border-dashed border-muted-foreground/25 hover:border-primary rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    + {t('createEvent.addTicketType', { defaultValue: 'Tickettyp hinzufügen' })}
                  </button>
                </div>
                  )}
                </>
              )}

              {payAtDoor && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="useTiers"
                      checked={useTiers}
                      onChange={(e) => handleUseTiersChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="useTiers">{t('createEvent.multipleTicketTypes', { defaultValue: 'Mehrere Tickettypen' })}</Label>
                  </div>

                  {!useTiers && !isRaffle && (
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('createEvent.doorPrice', { defaultValue: 'Preis an der Abendkasse (€)' })}</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00 (optional)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional – wird auf der EventCard angezeigt
                      </p>
                    </div>
                  )}

                  {useTiers && (
                    <div className="space-y-4">
                      {ticketTiers.map((tier, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{t('createEvent.ticketType', { defaultValue: 'Tickettyp' })} {index + 1}</span>
                            {ticketTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTier(index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Entfernen
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                              value={tier.name}
                              onChange={(e) => updateTier(index, 'name', e.target.value)}
                              placeholder={t('createEvent.ticketNamePlaceholder', { defaultValue: 'z.B. Standard, VIP, Early Bird' })}
                              required={useTiers}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Beschreibung</Label>
                            <Input
                              value={tier.description}
                              onChange={(e) => updateTier(index, 'description', e.target.value)}
                              placeholder={t('createEvent.ticketDescPlaceholder', { defaultValue: 'Kurze Beschreibung dieses Tickettyps' })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>{t('createEvent.ticketPrice', { defaultValue: 'Preis (€) *' })}</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={tier.price}
                                onChange={(e) => updateTier(index, 'price', e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('createEvent.ticketQuantity', { defaultValue: 'Menge' })}</Label>
                              <Input
                                type="number"
                                min="1"
                                value={tier.quantity}
                                onChange={(e) => updateTier(index, 'quantity', e.target.value)}
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addTier}
                        className="w-full py-2 border-2 border-dashed border-muted-foreground/25 hover:border-primary rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        + {t('createEvent.addTicketType', { defaultValue: 'Tickettyp hinzufügen' })}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Questions for ticket buyers */}
              <div className="space-y-4 pt-4 border-t mt-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      {t('createEvent.questionsTitle', { defaultValue: 'Fragen an Teilnehmer' })}
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('createEvent.addQuestion', { defaultValue: 'Frage hinzufügen' })}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('createEvent.questionsHint', { defaultValue: 'Pflichtfragen werden vor dem Ticketkauf gestellt. Optionale Fragen werden nach dem Kauf gestellt (höhere Abschlussrate, aber nicht jeder antwortet).' })}
                  </p>
                </div>

                {questions.map((q, idx) => (
                  <div key={q.questionId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Input
                        placeholder={t('createEvent.questionLabel', { defaultValue: 'Deine Frage' })}
                        value={q.label}
                        onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(idx, { type: e.target.value as 'text' | 'select' | 'checkbox' | 'multiselect' })}
                        className="border rounded-md px-3 py-2 text-sm bg-background"
                      >
                        <option value="text">{t('createEvent.qTypeText', { defaultValue: 'Textantwort' })}</option>
                        <option value="select">{t('createEvent.qTypeSelect', { defaultValue: 'Einzelauswahl' })}</option>
                        <option value="multiselect">{t('createEvent.qTypeMulti', { defaultValue: 'Mehrfachauswahl' })}</option>
                        <option value="checkbox">{t('createEvent.qTypeCheckbox', { defaultValue: 'Ja/Nein (Checkbox)' })}</option>
                      </select>

                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                        />
                        {t('createEvent.qRequired', { defaultValue: 'Pflichtfrage (vor dem Kauf)' })}
                      </label>
                    </div>

                    {(q.type === 'select' || q.type === 'multiselect') && (
                      <div className="space-y-2">
                        <Label className="text-sm">{t('createEvent.qOptions', { defaultValue: 'Antwortoptionen' })}</Label>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              placeholder={`${t('createEvent.qOption', { defaultValue: 'Option' })} ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const next = [...q.options]
                                next[optIdx] = e.target.value
                                updateQuestion(idx, { options: next })
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateQuestion(idx, { options: q.options.filter((_, i) => i !== optIdx) })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuestion(idx, { options: [...q.options, ''] })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('createEvent.qAddOption', { defaultValue: 'Option hinzufügen' })}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gewinnspiel-Option */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="font-semibold flex items-center gap-2">
                    🎰 {t('createEvent.isRaffle', { defaultValue: 'Gewinnspiel' })}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('createEvent.isRaffleDesc', { defaultValue: 'Teilnehmer können kostenlos mitmachen und gewinnen.' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRaffle(!isRaffle)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    isRaffle ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isRaffle ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {isRaffle && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Gewinn */}
                  <div className="space-y-2">
                    <Label>{t('createEvent.rafflePrize', { defaultValue: 'Was gibt es zu gewinnen?' })} *</Label>
                    <Input
                      value={rafflePrize}
                      onChange={(e) => setRafflePrize(e.target.value)}
                      placeholder={t('createEvent.rafflePrizePlaceholder', { defaultValue: 'z.B. 2x VIP-Tickets, Dinner für zwei, ...' })}
                      required
                    />
                  </div>

                  {/* Ziehungsdatum */}
                  <div className="space-y-2">
                    <Label>{t('createEvent.raffleDrawDate', { defaultValue: 'Ziehungsdatum' })}</Label>
                    <Input
                      type="datetime-local"
                      value={raffleDrawDate}
                      onChange={(e) => setRaffleDrawDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('createEvent.raffleDrawDateHint', { defaultValue: 'Leer lassen = Ziehung nach Event-Ende' })}
                    </p>
                  </div>

                  {/* Steuert den Wortlaut der Teilnahmebedingungen */}
                  <div className="pt-2 border-t">
                    <RaffleSettingsFields
                      drawOnSite={raffleDrawOnSite}
                      onDrawOnSiteChange={setRaffleDrawOnSite}
                      notifyWinnerByEmail={raffleNotifyWinnerByEmail}
                      onNotifyWinnerByEmailChange={setRaffleNotifyWinnerByEmail}
                      partner={rafflePartner}
                      onPartnerChange={setRafflePartner}
                      partnerMarketing={rafflePartnerMarketing}
                      onPartnerMarketingChange={setRafflePartnerMarketing}
                      hasDrawDate={!!raffleDrawDate}
                    />
                  </div>

                  {/* Hinweis */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <Gift className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{t('createEvent.raffleHint1', { defaultValue: 'Gewinnspiele sind immer kostenlos. Der Ticketpreis wird automatisch auf 0€ gesetzt.' })}</p>
                      <p>{t('createEvent.raffleHint2', { defaultValue: 'Die Teilnahme erfolgt durch Ticket-Buchung. Es besteht kein Kaufzwang.' })}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images (matching mobile StepThree) */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {t('createEvent.addLocationImage')}
                </span>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                    {t('createEvent.add')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,image/heic,image/heif"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-4">
                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('createEvent.uploadImagesHere')}</p>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('createEvent.maxImagesNote')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('createEvent.imageHint', { defaultValue: 'Ideales Format: 16:9 (z.B. 1920 × 1080 px)' })}
              </p>

              {/* KI-Kennzeichnung */}
              <div className="flex items-center justify-between mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    🤖 {t('createEvent.aiGenerated', { defaultValue: 'Mit KI erstellt' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('createEvent.aiGeneratedHint', { defaultValue: 'Aktivieren, wenn Bilder oder Texte mit KI erzeugt wurden.' })}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAiGenerated}
                  aria-label={t('createEvent.aiGenerated', { defaultValue: 'Mit KI erstellt' })}
                  onClick={() => setIsAiGenerated(!isAiGenerated)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    isAiGenerated ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAiGenerated ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step > 1 ? (
            <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
              {t('common.back')}
            </Button>
          ) : (
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" variant="gradient" className="flex-1" onClick={handleNext}>
              {t('common.next')}
            </Button>
          ) : (
            <Button type="submit" variant="gradient" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('createEvent.creating')}
                </>
              ) : (
                t('events.createEvent')
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        imageUrl={selectedImageUrl}
        onClose={handleCropClose}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        freeStyle={false}
        title="Event-Bild zuschneiden"
      />
    </div>
  )
}

export default function CreateEvent() {
  return (
    <Suspense>
      <CreateEventContent />
    </Suspense>
  )
}
