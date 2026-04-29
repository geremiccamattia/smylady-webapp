import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useGetConnectedAccount } from '@/hooks/useStripe'
import { eventsService } from '@/services/events'
import { userService } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

// Event visibility types (same as mobile app)
type EventVisibility = 'public' | 'subscribers' | 'selected'

// Categories matching mobile app exactly
const EVENT_CATEGORIES = [
  { value: 'Music', label: 'Music' },
  { value: 'Gastronomy', label: 'Gastronomy' },
  { value: 'Nature', label: 'Outdoor' },
  { value: 'Business', label: 'Business' },
  { value: 'On the Roof', label: 'On the Roof' },
  { value: 'Theme', label: 'Theme' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Ship', label: 'Ship' },
  { value: 'Other', label: 'Other' },
]

// Party types matching mobile app
const PARTY_TYPES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
]

// Music types matching mobile app
const MUSIC_TYPES = [
  { value: 'electronic', label: 'Electronic' },
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hip_hop', label: 'Hip Hop' },
  { value: 'classical', label: 'Classical' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'other', label: 'Other' },
]

// Offerings matching mobile app
const OFFERINGS = [
  { value: 'pool', label: 'Pool' },
  { value: 'food_drinks', label: 'Food & Drinks' },
  { value: 'terrasse', label: 'Terrace' },
  { value: 'grill', label: 'Grill' },
  { value: 'feuerstelle', label: 'Fireplace' },
  { value: 'other', label: 'Other' },
]

// Visibility options matching mobile app
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

interface Subscriber {
  _id?: string
  id?: string
  name: string
  username?: string
  profileImage?: string
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { data: connectedAccount } = useGetConnectedAccount()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [step, setStep] = useState(1)

  // Visibility state (matching mobile app)
  const [visibility, setVisibility] = useState<EventVisibility>('public')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [showSubscriberModal, setShowSubscriberModal] = useState(false)

  const userId = user?._id || user?.id

  // Fetch subscribers for visibility selector
  const { data: subscribersData, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ['subscribers', userId],
    queryFn: () => userService.getSubscribers(userId || ''),
    enabled: !!userId,
  })

  const subscribers: Subscriber[] = (Array.isArray(subscribersData) ? subscribersData : []).map(
    (user: Subscriber) => ({
      id: user._id || user.id,
      _id: user._id || user.id,
      name: user.name || user.username || 'Unknown',
      username: user.username,
      profileImage: user.profileImage,
    })
  )

  const [useTiers, setUseTiers] = useState(false)
  const [payAtDoor, setPayAtDoor] = useState(false)
  const [ticketTiers, setTicketTiers] = useState([
    { name: '', description: '', price: '', quantity: '' },
  ])

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

  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<
    Array<{ place_id: number; display_name: string; lat: string; lon: string }>
  >([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationResults([])
      setShowLocationDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5`
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
      setPendingFiles(files.slice(1))
      const imageUrl = URL.createObjectURL(files[0])
      setSelectedImageUrl(imageUrl)
      setCropModalOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    setImages((prev) => [...prev, croppedFile])

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews((prev) => [...prev, reader.result as string])
    }
    reader.readAsDataURL(croppedFile)

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }

    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0]
      setPendingFiles(pendingFiles.slice(1))
      const imageUrl = URL.createObjectURL(nextFile)
      setSelectedImageUrl(imageUrl)
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

  const toggleSubscriber = (subscriberId: string) => {
    if (invitedUsers.includes(subscriberId)) {
      setInvitedUsers(invitedUsers.filter((id) => id !== subscriberId))
    } else {
      setInvitedUsers([...invitedUsers, subscriberId])
    }
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
    if (!formData.locationName || formData.lat === 0 || formData.lng === 0) {
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
    const stripeReady = connectedAccount && connectedAccount.accountStatus === 'active'
    if (hasPaidTickets() && !stripeReady) {
      toast({
        variant: 'destructive',
        title: 'Stripe nicht verbunden',
        description: 'Um bezahlte Events zu erstellen, musst du zuerst Stripe in deinen Einstellungen verbinden.',
        action: (
          <ToastAction altText="Zu den Einstellungen" onClick={() => navigate('/settings')}>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
          <ToastAction altText="Zu den Einstellungen" onClick={() => navigate('/settings')}>
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
      const eventDate = new Date(formData.eventDate)
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

      // Add all form fields
      eventFormData.append('name', formData.name)
      eventFormData.append('description', formData.description)
      eventFormData.append('eventDate', eventDate.toISOString())
      eventFormData.append('eventStartTime', eventStartTime.toISOString())
      eventFormData.append('eventEndTime', eventEndTime.toISOString())
      eventFormData.append('locationName', formData.locationName)
      eventFormData.append('partyType', formData.partyType)
      eventFormData.append('category', formData.category)
      eventFormData.append('musicType', formData.musicType)
      eventFormData.append('offerings', formData.offerings)
      eventFormData.append('restrictions', formData.restrictions || '')
      eventFormData.append('minimumAge', formData.minimumAge || '0')

      if (useTiers && ticketTiers.length > 0) {
        const validTiers = ticketTiers.filter(t => t.name && t.price !== '')
        if (validTiers.length === 0) {
          toast({ variant: 'destructive', title: 'Fehler', description: 'Bitte mindestens einen Tickettyp mit Name und Preis anlegen.' })
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
        eventFormData.append('price', String(parseFloat(formData.price) || 0))
        eventFormData.append('totalTickets', String(parseInt(formData.totalTickets) || 0))
      }

      // Add visibility settings (matching mobile app)
      eventFormData.append('visibility', visibility)
      if (visibility === 'selected' && invitedUsers.length > 0) {
        eventFormData.append('invitedUsers', JSON.stringify(invitedUsers))
      }
      eventFormData.append('allowGuestMemories', String(allowGuestMemories))
      eventFormData.append('paymentType', payAtDoor ? 'door' : 'online')

      eventFormData.append(
        'location',
        JSON.stringify({
          type: 'Point',
          coordinates: [formData.lng, formData.lat],
        })
      )

      // Add images
      images.forEach((image) => {
        eventFormData.append('files', image)
      })

      await eventsService.createEvent(eventFormData)

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'create_event' })

      // No toast shown here - user will receive push notification about event approval status
      navigate('/my-events')
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
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    onClick={() => setShowSubscriberModal(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {invitedUsers.length > 0
                      ? t('createEvent.selectedCount', { count: invitedUsers.length })
                      : t('createEvent.selectSubscribers')}
                  </Button>
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
              </CardContent>
            </Card>

            {/* Location (matching mobile) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('createEvent.whereParty')}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                </div>
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
                  <Label>Gäste dürfen Fotos hochladen</Label>
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
                <textarea
                  id="description"
                  className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-background resize-y"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('createEvent.addDetails')}
                  required
                />
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
                  <Label className="text-sm font-medium">Tickets an der Abendkasse zahlen</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gäste reservieren ihren Platz und zahlen vor Ort
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
                    <Label htmlFor="useTiers">Mehrere Tickettypen</Label>
                  </div>

                  {!useTiers && (
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
                        <span className="font-medium text-sm">Tickettyp {index + 1}</span>
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
                          placeholder="z.B. Standard, VIP, Early Bird"
                          required={useTiers}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Beschreibung</Label>
                        <Input
                          value={tier.description}
                          onChange={(e) => updateTier(index, 'description', e.target.value)}
                          placeholder="Kurze Beschreibung dieses Tickettyps"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Preis (€) *</Label>
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
                          <Label>Menge</Label>
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
                    + Tickettyp hinzufügen
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
                    <Label htmlFor="useTiers">Mehrere Tickettypen</Label>
                  </div>

                  {!useTiers && (
                    <div className="space-y-2">
                      <Label htmlFor="price">Preis an der Abendkasse (€)</Label>
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
                            <span className="font-medium text-sm">Tickettyp {index + 1}</span>
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
                              placeholder="z.B. Standard, VIP, Early Bird"
                              required={useTiers}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Beschreibung</Label>
                            <Input
                              value={tier.description}
                              onChange={(e) => updateTier(index, 'description', e.target.value)}
                              placeholder="Kurze Beschreibung dieses Tickettyps"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Preis (€)</Label>
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
                              <Label>Menge</Label>
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
                        + Tickettyp hinzufügen
                      </button>
                    </div>
                  )}
                </>
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
                    accept="image/*"
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
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
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

      {/* Subscriber Selection Modal (matching mobile) */}
      <Dialog open={showSubscriberModal} onOpenChange={setShowSubscriberModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('createEvent.selectSubscribers')}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingSubscribers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : subscribers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('createEvent.noSubscribers')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subscribers.map((subscriber) => {
                  const subId = subscriber._id || subscriber.id || ''
                  return (
                    <div
                      key={subId}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => toggleSubscriber(subId)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={subscriber.profileImage || ''} />
                        <AvatarFallback>
                          {subscriber.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{subscriber.name}</p>
                        {subscriber.username && (
                          <p className="text-sm text-muted-foreground">@{subscriber.username}</p>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          invitedUsers.includes(subId)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {invitedUsers.includes(subId) && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => setShowSubscriberModal(false)}>
              {t('common.done')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
