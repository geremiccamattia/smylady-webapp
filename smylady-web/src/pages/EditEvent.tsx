import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useGetConnectedAccount } from '@/hooks/useStripe'
import { eventsService } from '@/services/events'
import { EVENT_CATEGORIES, MUSIC_TYPES, AGE_RESTRICTIONS } from '@/lib/constants'
import { resolveImageUrl } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Upload, X, Calendar, MapPin, Ticket, Music, Info, ArrowLeft, Loader2 } from 'lucide-react'

export default function EditEvent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { data: connectedAccount } = useGetConnectedAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [seriesScope, setSeriesScope] = useState<'this' | 'future' | 'all' | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  
  const [useTiers, setUseTiers] = useState(false)
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

  const [allowGuestMemories, setAllowGuestMemories] = useState(true)
  const [payAtDoor, setPayAtDoor] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    partyType: '',
    musicType: '',
    price: '',
    totalTickets: '',
    eventDate: '',
    eventStartTime: '',
    eventEndTime: '',
    locationName: '',
    minimumAge: '0',
    offerings: '',
    restrictions: '',
    visibility: 'public',
  })

  // Fetch existing event
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.getEventById(id!),
    enabled: !!id,
  })

  const parseStringField = (value: unknown): string => {
    const unwrap = (v: unknown): string[] => {
      if (!v) return []
      if (Array.isArray(v)) return v.flatMap(unwrap)
      if (typeof v === 'string') {
        const trimmed = v.trim()
        if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
          try {
            return unwrap(JSON.parse(trimmed))
          } catch {}
        }
        return trimmed ? [trimmed] : []
      }
      return [String(v)]
    }
    return unwrap(value).join(', ')
  }

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      const eventDate = event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ''
      
      setFormData({
        name: event.name || '',
        description: event.description || '',
        category: event.category || '',
        partyType: event.partyType || '',
        musicType: event.musicType || '',
        price: event.price?.toString() || '0',
        totalTickets: event.totalTickets?.toString() || '',
        eventDate,
        eventStartTime: event.eventStartTime
          ? `${String(new Date(event.eventStartTime).getHours()).padStart(2, '0')}:${String(new Date(event.eventStartTime).getMinutes()).padStart(2, '0')}`
          : '',
        eventEndTime: event.eventEndTime
          ? `${String(new Date(event.eventEndTime).getHours()).padStart(2, '0')}:${String(new Date(event.eventEndTime).getMinutes()).padStart(2, '0')}`
          : '',
        locationName: event.locationName || '',
        minimumAge: event.minimumAge?.toString() || '0',
        offerings: parseStringField(event.offerings),
        restrictions: parseStringField(event.restrictions),
        visibility: event.visibility || 'public',
      })
      setAllowGuestMemories(event.allowGuestMemories !== false)
      setPayAtDoor((event as any).paymentType === 'door')

      // Set ticket tiers if present
      if (event.ticketTiers && event.ticketTiers?.length > 0) {
        setUseTiers(true)
        setTicketTiers(event.ticketTiers?.map((t: any) => ({
          name: t.name || '',
          description: t.description || '',
          price: t.price?.toString() || '',
          quantity: t.quantity?.toString() || '',
        })))
      }

      // Set existing images
      if (event.locationImages && event.locationImages.length > 0) {
        setExistingImages(event.locationImages.map((img: { url: string }) => img.url))
      } else if (event.thumbnailUrl) {
        setExistingImages([event.thumbnailUrl])
      }
    }
  }, [event])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = existingImages.length + images.length + files.length
    
    if (totalImages > 5) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('createEvent.maxImages'),
      })
      return
    }

    // Reset input
    if (e.target) {
      e.target.value = ''
    }

    // Queue files and start cropping first one
    if (files.length > 0) {
      setPendingFiles(files.slice(1)) // Queue remaining files
      const imageUrl = URL.createObjectURL(files[0])
      setSelectedImageUrl(imageUrl)
      setCropModalOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    // Add cropped image
    setImages(prev => [...prev, croppedFile])
    
    // Generate preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result as string])
    }
    reader.readAsDataURL(croppedFile)
    
    // Clean up current URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
    
    // Process next pending file
    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0]
      setPendingFiles(pendingFiles.slice(1))
      const imageUrl = URL.createObjectURL(nextFile)
      setSelectedImageUrl(imageUrl)
      // Keep modal open for next image
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

  const removeNewImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const hasPaidTickets = () => {
    if (payAtDoor) return false
    if (useTiers) return ticketTiers.some(t => parseFloat(t.price) > 0)
    return parseFloat(formData.price) > 0
  }

  const buildEventFormData = () => {
    const eventFormData = new FormData()

    const { offerings, restrictions, eventDate, eventStartTime, eventEndTime, price, totalTickets, minimumAge, ...restFormData } = formData
    Object.entries(restFormData).forEach(([key, value]) => {
      eventFormData.append(key, value)
    })

    if (eventDate) {
      eventFormData.append('eventDate', new Date(eventDate).toISOString())
    }

    if (eventDate && eventStartTime) {
      const startDateTime = new Date(`${eventDate}T${eventStartTime}:00`)
      eventFormData.append('eventStartTime', startDateTime.toISOString())
    }

    if (eventDate && eventEndTime) {
      const endDateTime = new Date(`${eventDate}T${eventEndTime}:00`)
      eventFormData.append('eventEndTime', endDateTime.toISOString())
    } else if (eventDate && eventStartTime) {
      const fallbackEnd = new Date(`${eventDate}T${eventStartTime}:00`)
      fallbackEnd.setHours(fallbackEnd.getHours() + 4)
      eventFormData.append('eventEndTime', fallbackEnd.toISOString())
    }

    const offeringsArray = offerings ? offerings.split(',').map(s => s.trim()).filter(Boolean) : []
    const restrictionsArray = restrictions ? restrictions.split(',').map(s => s.trim()).filter(Boolean) : []
    eventFormData.append('offerings', JSON.stringify(offeringsArray))
    eventFormData.append('restrictions', JSON.stringify(restrictionsArray))
    eventFormData.append('allowGuestMemories', String(allowGuestMemories))
    eventFormData.append('paymentType', payAtDoor ? 'door' : 'online')
    eventFormData.append('minimumAge', String(parseInt(minimumAge) || 0))

    if (useTiers && ticketTiers.length > 0) {
      const validTiers = ticketTiers.filter(t => t.name && t.price !== '')
      const tiersPayload = validTiers.map(t => ({
        name: t.name,
        description: t.description,
        price: parseFloat(t.price) || 0,
        ...(t.quantity ? { quantity: parseInt(t.quantity) } : {}),
      }))
      eventFormData.append('ticketTiers', JSON.stringify(tiersPayload))
    } else {
      eventFormData.append('price', String(parseFloat(price) || 0))
      eventFormData.append('totalTickets', String(parseInt(totalTickets) || 0))
    }

    eventFormData.append('existingImages', JSON.stringify(existingImages))

    if (event?.location) {
      eventFormData.append('location', JSON.stringify(event.location))
    }

    images.forEach(image => {
      eventFormData.append('files', image)
    })

    return eventFormData
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const stripeReady = connectedAccount && connectedAccount.accountStatus === 'active'
    if (hasPaidTickets() && !stripeReady) {
      toast({
        variant: 'destructive',
        title: 'Stripe nicht verbunden',
        description: 'Um bezahlte Events zu speichern, musst du zuerst Stripe in deinen Einstellungen verbinden.',
        action: (
          <ToastAction altText="Zu den Einstellungen" onClick={() => navigate('/settings')}>
            Einstellungen
          </ToastAction>
        ),
      })
      return
    }

    if (useTiers && ticketTiers.filter(t => t.name && t.price !== '').length === 0) {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Bitte mindestens einen Tickettyp mit Name und Preis anlegen.' })
      return
    }

    setIsLoading(true)
    try {
      const eventFormData = buildEventFormData()

      if ((event as any)?.eventSeriesId) {
        if (!seriesScope) {
          toast({ variant: 'destructive', title: 'Bitte wähle aus', description: 'Bitte wähle aus welche Events der Serie du bearbeiten möchtest.' })
          setIsLoading(false)
          return
        }
        eventFormData.append('scope', seriesScope)
        await eventsService.updateEventSeries(id!, eventFormData)
      } else {
        await eventsService.updateEvent(id!, eventFormData)
      }

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'update_event' })
      toast({ title: t('editEvent.updateSuccess'), description: t('editEvent.changesSaved') })
      navigate(`/event/${id}`)
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.response?.data?.message || t('editEvent.updateFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">{t('events.notFound')}</h2>
        <Button onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <h1 className="text-3xl font-bold mb-6">{t('events.editEvent')}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('editEvent.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('events.eventName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('editEvent.eventNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('events.description')} *</Label>
              <textarea
                id="description"
                className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-background resize-y"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('editEvent.descriptionPlaceholder')}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('events.category')} *</Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')}</option>
                  {EVENT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyType">{t('editEvent.partyType')}</Label>
                <Input
                  id="partyType"
                  value={formData.partyType}
                  onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}
                  placeholder={t('editEvent.partyTypePlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('editEvent.dateAndTime')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">{t('events.date')} *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStartTime">{t('editEvent.startTime')} *</Label>
                <Input
                  id="eventStartTime"
                  type="time"
                  value={formData.eventStartTime}
                  onChange={(e) => setFormData({ ...formData, eventStartTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEndTime">{t('editEvent.endTime')} *</Label>
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

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('events.location')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="locationName">{t('editEvent.locationLabel')} *</Label>
              <Input
                id="locationName"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                placeholder={t('editEvent.locationPlaceholder')}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Tickets & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {t('editEvent.ticketsAndPricing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Abendkasse Toggle */}
            <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-lg border">
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

            {!payAtDoor && !useTiers && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t('editEvent.priceLabel')} *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder={t('editEvent.pricePlaceholder')}
                    required={!useTiers && !payAtDoor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalTickets">{t('editEvent.ticketCount')} *</Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    min="1"
                    value={formData.totalTickets}
                    onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                    placeholder={t('editEvent.maxParticipants')}
                    required={!useTiers && !payAtDoor}
                  />
                </div>
              </div>
            )}

            {payAtDoor && !useTiers && (
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
                        <Label>{payAtDoor ? 'Preis (€)' : 'Preis (€) *'}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => updateTier(index, 'price', e.target.value)}
                          placeholder="0.00"
                          required={useTiers && !payAtDoor}
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

            <div className="space-y-2">
              <Label htmlFor="minimumAge">{t('editEvent.minimumAge')}</Label>
              <select
                id="minimumAge"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={formData.minimumAge}
                onChange={(e) => setFormData({ ...formData, minimumAge: e.target.value })}
              >
                {AGE_RESTRICTIONS.map(age => (
                  <option key={age.value} value={age.value}>{age.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Music & Extras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {t('editEvent.musicAndExtras')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="musicType">{t('editEvent.musicType')}</Label>
              <select
                id="musicType"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={formData.musicType}
                onChange={(e) => setFormData({ ...formData, musicType: e.target.value })}
              >
                <option value="">{t('common.select')}</option>
                {MUSIC_TYPES.map(music => (
                  <option key={music.value} value={music.value}>{music.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="offerings">{t('editEvent.offeringsLabel')}</Label>
              <Input
                id="offerings"
                value={formData.offerings}
                onChange={(e) => setFormData({ ...formData, offerings: e.target.value })}
                placeholder={t('editEvent.offeringsPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restrictions">{t('editEvent.restrictionsLabel')}</Label>
              <Input
                id="restrictions"
                value={formData.restrictions}
                onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                placeholder={t('editEvent.restrictionsPlaceholder')}
              />
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

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('events.images')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Existing Images */}
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={resolveImageUrl(image)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {/* New Image Previews */}
              {imagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                    {t('editEvent.new')}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {existingImages.length + images.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">{t('editEvent.addImage')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('editEvent.maxImagesNote')}
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="space-y-4">
          {(event as any)?.eventSeriesId && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">
                Dieses Event ist Teil einer Serie. Was möchtest du ändern?
              </p>
              <div className="flex gap-2">
                {(['this', 'future', 'all'] as const).map((scope) => {
                  const labels = {
                    this: 'Nur dieses Event',
                    future: 'Dieses + Folgende',
                    all: 'Alle Events',
                  }
                  return (
                    <Button
                      key={scope}
                      type="button"
                      variant={seriesScope === scope ? 'gradient' : 'outline'}
                      className="flex-1"
                      onClick={() => setSeriesScope(scope)}
                    >
                      {labels[scope]}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-bg"
              disabled={isLoading || ((event as any)?.eventSeriesId && !seriesScope)}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('editEvent.saveChanges')}
            </Button>
          </div>
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
