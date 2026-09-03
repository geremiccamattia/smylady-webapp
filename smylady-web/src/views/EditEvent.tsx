'use client'

import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useGetConnectedAccount } from '@/hooks/useStripe'
import { eventsService } from '@/services/events'
import { EVENT_CATEGORIES, MUSIC_TYPES, AGE_RESTRICTIONS } from '@/lib/constants'
import { resolveImageUrl, isMultiDayEvent } from '@/lib/utils'
import { isHeicFile } from '@/lib/heic'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Upload, X, Calendar, MapPin, Ticket, Music, Info, ArrowLeft, Loader2, Plus, Trash2, Languages, Users } from 'lucide-react'
import RecurringEventModal from '@/components/events/RecurringEventModal'
import { RaffleSettingsFields } from '@/components/events/RaffleSettingsFields'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import {
  SubscriberPicker,
  useSubscribers,
  normalizeInvitedUsers,
  getSubscriberId,
} from '@/components/events/SubscriberPicker'
import { VisibilitySelector, type EventVisibility } from '@/components/events/VisibilitySelector'

export default function EditEvent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { data: connectedAccount } = useGetConnectedAccount()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [seriesScope, setSeriesScope] = useState<'this' | 'future' | 'all' | null>(null)
  const [showAddDates, setShowAddDates] = useState(false)
  const [newDates, setNewDates] = useState<string[]>([])
  const [addingDates, setAddingDates] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [isAiGenerated, setIsAiGenerated] = useState(false)
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

  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [seriesConfig, setSeriesConfig] = useState<{
    recurrence: string
    occurrences: number
    customDates?: string[]
    customLabel?: string
  } | null>(null)

  const [allowGuestMemories, setAllowGuestMemories] = useState(true)
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTimeValue, setEventEndTimeValue] = useState('')
  const [payAtDoor, setPayAtDoor] = useState(false)
  const [addressDetail, setAddressDetail] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<any[]>([])
  const [locationType, setLocationType] = useState<'physical' | 'online' | 'tba'>('physical')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [tbaCityQuery, setTbaCityQuery] = useState('')
  const [tbaCityResults, setTbaCityResults] = useState<Array<{ name: string; lat: number; lng: number }>>([])
  const [selectedTbaCity, setSelectedTbaCity] = useState<{ name: string; lat: number; lng: number } | null>(null)
  // Nachträgliche Einladungen: nur die NEU hinzugefügten IDs. Die bestehenden
  // stehen am Event und werden beim Speichern wieder mitgeschickt (siehe
  // buildEventFormData) — sie sind hier bewusst nicht Teil des States, damit ein
  // Rendern ohne geladenes Event sie nicht versehentlich leert.
  const [newInvitedUsers, setNewInvitedUsers] = useState<string[]>([])
  // Gewinnspiel-Einstellungen, die den Wortlaut der Teilnahmebedingungen steuern.
  const [raffleDrawOnSite, setRaffleDrawOnSite] = useState(false)
  const [raffleNotifyWinnerByEmail, setRaffleNotifyWinnerByEmail] = useState(false)
  const [rafflePartner, setRafflePartner] = useState('')
  const [rafflePartnerMarketing, setRafflePartnerMarketing] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translatedPreview, setTranslatedPreview] = useState<{
    lang: string; name: string; description: string; restrictions: string
  } | null>(null)

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
    location: null as { type: string; coordinates: number[] } | null,
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

  /**
   * Die echte ObjectId des Events — für alle schreibenden Aufrufe.
   *
   * `id` aus der URL ist ein SLUG ("sommerfest-9e6365c1"). Manche Backend-Methoden
   * lösen ihn über extractEventId auf (findOne, update, updateEventSeries,
   * deleteEventSeries), andere nicht: convertToSeries und addSerieDates gehen
   * direkt auf findById und laufen mit einem Slug in einen CastError.
   *
   * Der Fallback auf `id` bleibt für den Moment, in dem das Event noch lädt —
   * dort greift ohnehin keiner der schreibenden Pfade.
   */
  const resolvedEventId = (event as any)?._id || (event as any)?.id || id

  const organizerId = user?._id || user?.id
  // Dieselbe Query wie im Picker (gleicher Key) — React Query liefert sie aus dem
  // Cache, es wird also nicht doppelt geladen. Hier nur, um zu IDs die Namen und
  // Profilbilder aufzulösen, falls das Backend invitedUsers unpopuliert schickt.
  const { subscribers } = useSubscribers(organizerId)

  const isSelectedVisibility = formData.visibility === 'selected'
  const existingInvitedUsers = normalizeInvitedUsers((event as any)?.invitedUsers, subscribers)
  const existingInvitedIds = existingInvitedUsers.map(getSubscriberId).filter(Boolean)
  const newlyInvitedUsers = newInvitedUsers.map(
    (id) => subscribers.find((s) => getSubscriberId(s) === id) ?? { _id: id, id, name: '' },
  )

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
        locationName: (() => {
          const existingLocation = event.locationName || ''
          const detailMatch = existingLocation.match(/\s*Top\s+(.+)$/)
          if (detailMatch) {
            setAddressDetail(detailMatch[1])
            return existingLocation.replace(/\s*Top\s+.+$/, '')
          }
          return existingLocation
        })(),
        location: null,
        minimumAge: event.minimumAge?.toString() || '0',
        offerings: parseStringField(event.offerings),
        restrictions: parseStringField(event.restrictions),
        visibility: event.visibility || 'public',
      })
      setAllowGuestMemories(event.allowGuestMemories !== false)
      setPayAtDoor((event as any).paymentType === 'door')
      setLocationType((event as any).locationType || 'physical')
      setOnlineUrl((event as any).onlineUrl || '')
      setIsAiGenerated(event.isAiGenerated || false)
      setRaffleDrawOnSite(event.raffleDrawOnSite === true)
      setRaffleNotifyWinnerByEmail(event.raffleNotifyWinnerByEmail === true)
      setRafflePartner(event.rafflePartner || '')
      setRafflePartnerMarketing(event.rafflePartnerMarketing === true)

      if (event.eventEndTime && isMultiDayEvent(event.eventStartTime || event.eventDate, event.eventEndTime)) {
        setIsMultiDay(true)
        const endDate = new Date(event.eventEndTime)
        setEventEndDate(endDate.toISOString().split('T')[0])
        setEventEndTimeValue(
          `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
        )
      } else {
        setIsMultiDay(false)
        setEventEndDate('')
        setEventEndTimeValue('')
      }
      if ((event as any).locationType === 'physical' || !(event as any).locationType) {
        setLocationQuery(event.locationName || '')
      }
      if ((event as any).locationType === 'tba' && event.locationName) {
        const cityName = event.locationName.replace(' — Standort folgt', '')
        if (cityName && cityName !== 'Standort folgt') {
          const coords = event.location?.coordinates
          setSelectedTbaCity({
            name: cityName,
            lat: coords?.[1] || 0,
            lng: coords?.[0] || 0,
          })
        }
      }

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

      // Load existing questions
      if (event.questions && event.questions.length > 0) {
        setQuestions(event.questions.map((q: any) => ({
          questionId: q.questionId,
          label: q.label,
          type: q.type || 'text',
          required: q.required ?? false,
          options: q.options || [],
        })))
      }

      // Load existing translation into editable preview
      const eventTranslations = (event as any)?.translations
      if (eventTranslations) {
        const hasGerman = /[äöüßÄÖÜ]/.test(event.description || '')
        const otherLang = hasGerman ? 'en' : 'de'
        const existing = eventTranslations[otherLang]
        if (existing && (existing.name || existing.description)) {
          setTranslatedPreview({
            lang: otherLang,
            name: existing.name || '',
            description: existing.description || '',
            restrictions: existing.restrictions || '',
          })
        }
      }

      // Set existing images
      if (event.locationImages && event.locationImages.length > 0) {
        setExistingImages(event.locationImages.map((img: { url: string }) => img.url))
      } else if (event.thumbnailUrl) {
        setExistingImages([event.thumbnailUrl])
      }
    }
  }, [event])

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

  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.trim().length < 3) {
      setLocationResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5&addressdetails=1&countrycodes=at,de,ch`
        )
        const data = await res.json()
        setLocationResults(data)
      } catch {
        setLocationResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [locationQuery])

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
        fileToUse = new File([compressed], file.name, { type: compressed.type })
      } catch {
        console.warn('Image compression failed, using original')
      }
    }

    setImages(prev => [...prev, fileToUse])

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews(prev => [...prev, reader.result as string])
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

  const handleSaveTranslation = async () => {
    if (!id || !translatedPreview) return
    setTranslating(true)
    try {
      await eventsService.saveEventTranslation(resolvedEventId, translatedPreview.lang, {
        name: translatedPreview.name,
        description: translatedPreview.description,
        restrictions: translatedPreview.restrictions,
      })
      toast({
        title: t('editEvent.translationSaved', { defaultValue: 'Übersetzung gespeichert' }),
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: error?.response?.data?.message || 'Speichern fehlgeschlagen',
      })
    } finally {
      setTranslating(false)
    }
  }

  const handleTranslate = async () => {
    if (!id) return
    setTranslating(true)
    try {
      const currentLang = i18n.language?.substring(0, 2) === 'de' ? 'EN' : 'DE'
      const result = await eventsService.translateEvent(resolvedEventId, currentLang as 'DE' | 'EN')
      const translated = result.translations[currentLang.toLowerCase()]
      if (translated) {
        setTranslatedPreview({
          lang: currentLang.toLowerCase(),
          name: translated.name,
          description: translated.description,
          restrictions: translated.restrictions,
        })
      }
      toast({
        title: t('editEvent.translated', {
          defaultValue: currentLang === 'DE'
            ? 'Auf Deutsch übersetzt'
            : 'Translated to English',
        }),
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

  /**
   * Verwirft nach dem Speichern alle Übersetzungen, wenn einer der übersetzten
   * Texte geändert wurde — auch die der anderen Sprache, die in dieser Ansicht gar
   * nicht sichtbar ist. Die Anzeige fällt dann über `tr?.description ||
   * event.description` auf das zurück, was gerade eingetippt wurde. Ein
   * unübersetzter, aber richtiger Text ist besser als eine veraltete Fassung: Beim
   * Weintage-Event fehlte im alten Text z.B. der Ziehungstermin.
   *
   * Bewusst NICHT über buildEventFormData: `translations` steht nicht im
   * UpdateEventDto des Backends, und die ValidationPipe läuft mit whitelist: true —
   * ein mitgeschicktes Feld würde kommentarlos verworfen. Der dedizierte Endpoint
   * PATCH /events/:id/translation schreibt dagegen direkt und akzeptiert
   * Leerstrings (er speichert `data.name || ''`).
   *
   * Läuft erst NACH dem erfolgreichen Update: Schlägt das Speichern fehl, bleiben
   * die Übersetzungen unangetastet.
   */
  const discardOutdatedTranslations = async () => {
    const translations = (event as any)?.translations
    if (!translations) return

    const textFieldsChanged =
      formData.name !== (event?.name ?? '') ||
      formData.description !== (event?.description ?? '') ||
      formData.restrictions !== parseStringField(event?.restrictions)
    if (!textFieldsChanged) return

    // '_id' ist die Subdokument-ID des Mongoose-Objekts, keine Sprache
    const langs = Object.keys(translations).filter((l) => l !== '_id')
    const eventId = resolvedEventId

    await Promise.all(
      langs.map((lang) =>
        eventsService
          .saveEventTranslation(eventId, lang, { name: '', description: '', restrictions: '' })
          // Das Event selbst ist zu diesem Zeitpunkt bereits gespeichert. Scheitert
          // das Leeren, ist das ein Schönheitsfehler — kein Grund, dem Veranstalter
          // eine fehlgeschlagene Speicherung zu melden.
          .catch((e) => console.error(`[EditEvent] Übersetzung "${lang}" konnte nicht verworfen werden:`, e)),
      ),
    )
  }

  const buildEventFormData = () => {
    const eventFormData = new FormData()

    const { offerings, restrictions, eventDate, eventStartTime, eventEndTime, price, totalTickets, minimumAge, locationName, location, ...restFormData } = formData
    Object.entries(restFormData).forEach(([key, value]) => {
      eventFormData.append(key, value)
    })

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
    } else {
      const fullLocationName = addressDetail.trim()
        ? `${locationName} Top ${addressDetail.trim()}`
        : locationName
      eventFormData.append('locationName', fullLocationName)
    }
    if (onlineUrl) {
      eventFormData.append('onlineUrl', onlineUrl)
    }

    if (eventDate) {
      eventFormData.append('eventDate', new Date(eventDate).toISOString())
    }

    if (eventDate && eventStartTime) {
      const [hours, minutes] = eventStartTime.split(':').map(Number)
      const startDate = new Date(eventDate)
      startDate.setHours(hours, minutes, 0, 0)
      eventFormData.append('eventStartTime', startDate.toISOString())
    }

    if (isMultiDay && eventEndDate) {
      // Mehrtägiges Event: Enddatum überschreibt die einfache Uhrzeit-Berechnung unten
      const multiDayEnd = new Date(eventEndDate + 'T00:00:00')
      if (eventEndTimeValue) {
        const [hours, minutes] = eventEndTimeValue.split(':').map(Number)
        multiDayEnd.setHours(hours, minutes, 0, 0)
      } else {
        multiDayEnd.setHours(23, 59, 0, 0)
      }
      eventFormData.append('eventEndTime', multiDayEnd.toISOString())
    } else if (eventDate && eventEndTime) {
      const [hours, minutes] = eventEndTime.split(':').map(Number)
      const endDate = new Date(eventDate)
      endDate.setHours(hours, minutes, 0, 0)
      eventFormData.append('eventEndTime', endDate.toISOString())
    } else if (eventDate && eventStartTime) {
      const [hours, minutes] = eventStartTime.split(':').map(Number)
      const fallbackEnd = new Date(eventDate)
      fallbackEnd.setHours(hours + 4, minutes, 0, 0)
      eventFormData.append('eventEndTime', fallbackEnd.toISOString())
    }

    const offeringsArray = offerings ? offerings.split(',').map(s => s.trim()).filter(Boolean) : []
    const restrictionsArray = restrictions ? restrictions.split(',').map(s => s.trim()).filter(Boolean) : []
    eventFormData.append('offerings', JSON.stringify(offeringsArray))
    eventFormData.append('restrictions', JSON.stringify(restrictionsArray))

    eventFormData.append('allowGuestMemories', String(allowGuestMemories))
    eventFormData.append('paymentType', payAtDoor ? 'door' : 'online')
    // Immer senden (nicht nur wenn true) — sonst lässt sich eine einmal gesetzte
    // KI-Kennzeichnung beim Bearbeiten nicht mehr entfernen.
    eventFormData.append('isAiGenerated', String(isAiGenerated))
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

    eventFormData.append('existingImages', JSON.stringify(existingImages))

    // Nur bei Gewinnspielen — diese Felder bestimmen den Wortlaut der
    // Teilnahmebedingungen und dürfen bei anderen Events nicht mitgeschickt werden.
    if ((event as any)?.isRaffle) {
      eventFormData.append('raffleDrawOnSite', String(raffleDrawOnSite))
      eventFormData.append('raffleNotifyWinnerByEmail', String(raffleNotifyWinnerByEmail))
      eventFormData.append('rafflePartner', rafflePartner.trim())
      eventFormData.append(
        'rafflePartnerMarketing',
        String(rafflePartner.trim() ? rafflePartnerMarketing : false),
      )
    }

    // Einladungen nur mitschicken, wenn tatsächlich jemand dazugekommen ist —
    // ein Speichern ohne Änderung an diesem Abschnitt lässt das Feld unberührt
    // und kann die bestehende Liste damit auch nicht beschädigen.
    //
    // Gesendet wird dann die VOLLSTÄNDIGE Liste (bestehende + neue), weil von hier
    // aus nicht feststellbar ist, ob das Backend invitedUsers ersetzt oder ergänzt
    // (das Backend liegt in einem eigenen Repo). Bei "ersetzt" ist das die einzig
    // korrekte Variante; bei "ergänzt" hängt es daran, ob serverseitig $addToSet
    // oder $push verwendet wird — siehe Rückfrage im Bericht.
    if (isSelectedVisibility && newInvitedUsers.length > 0) {
      const mergedInvitedUsers = Array.from(new Set([...existingInvitedIds, ...newInvitedUsers]))
      eventFormData.append('invitedUsers', JSON.stringify(mergedInvitedUsers))
    }

    if (locationType === 'physical' && (location || event?.location)) {
      eventFormData.append('location', JSON.stringify(location || event?.location))
    }

    images.forEach(image => {
      eventFormData.append('files', image)
    })

    return eventFormData
  }

  const handleAddDate = () => {
    setNewDates([...newDates, ''])
  }

  const handleRemoveDate = (index: number) => {
    setNewDates(newDates.filter((_, i) => i !== index))
  }

  const handleDateChange = (index: number, value: string) => {
    const updated = [...newDates]
    updated[index] = value
    setNewDates(updated)
  }

  const handleSaveNewDates = async () => {
    // datetime-local Werte in ISO konvertieren damit der Backend die Zeitzone korrekt hat
    const validDates = newDates.filter((d) => d).map((d) => new Date(d).toISOString())
    if (validDates.length === 0) return
    setAddingDates(true)
    try {
      console.log('Calling addSeriesDates with:', id, validDates)
      const result = await eventsService.addSeriesDates(resolvedEventId, validDates)
      console.log('addSeriesDates result:', result)
      toast({
        title: `${validDates.length} Termine hinzugefügt`,
      })
      setNewDates([])
      setShowAddDates(false)
    } catch (error: any) {
      console.error('addSeriesDates ERROR:', error)
      console.error('Response:', error?.response?.data)
      console.error('Status:', error?.response?.status)
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error?.response?.data?.message || error?.message || 'Unbekannter Fehler',
      })
    } finally {
      setAddingDates(false)
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

    const stripeReady = connectedAccount && connectedAccount.accountStatus === 'active'
    if (hasPaidTickets() && !stripeReady) {
      toast({
        variant: 'destructive',
        title: 'Stripe nicht verbunden',
        description: 'Um bezahlte Events zu speichern, musst du zuerst Stripe in deinen Einstellungen verbinden.',
        action: (
          <ToastAction altText="Zu den Einstellungen" onClick={() => router.push('/settings')}>
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

      if (seriesConfig) {
        // Bestehendes Event serverseitig in Serie umwandeln
        // Bilder werden direkt vom bestehenden Event kopiert — kein Re-Upload nötig
        const config = { ...seriesConfig }
        // baseDate aus customDates entfernen — convertToSeries nutzt
        // das bestehende Event bereits als Index 0
        if (config.customDates && formData.eventDate) {
          config.customDates = config.customDates.filter((d: string) => d !== formData.eventDate)
        }
        await eventsService.convertToSeries(resolvedEventId, config)
        toast({ title: 'Serie erstellt!' })
        router.push('/my-events')
        return
      }

      if ((event as any)?.eventSeriesId) {
        if (!seriesScope) {
          toast({ variant: 'destructive', title: 'Bitte wähle aus', description: 'Bitte wähle aus welche Events der Serie du bearbeiten möchtest.' })
          setIsLoading(false)
          return
        }
        eventFormData.append('scope', seriesScope)
        await eventsService.updateEventSeries(resolvedEventId, eventFormData)
      } else {
        await eventsService.updateEvent(resolvedEventId, eventFormData)
      }

      await discardOutdatedTranslations()

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'update_event' })
      toast({ title: t('editEvent.updateSuccess'), description: t('editEvent.changesSaved') })
      router.push(`/event/${id}`)
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
        <Button onClick={() => router.back()}>{t('common.back')}</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.back()}
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
              <MarkdownEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder={t('editEvent.descriptionPlaceholder')}
              />
            </div>

            {id && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleTranslate}
                  disabled={translating || !formData.description}
                >
                  <Languages className="h-4 w-4" />
                  {translating
                    ? t('editEvent.translating', { defaultValue: 'Übersetze...' })
                    : t('editEvent.translateBtn', { defaultValue: 'Automatisch übersetzen (DE ↔ EN)' })}
                </Button>

                {translatedPreview && (
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {translatedPreview.lang === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch'}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveTranslation}
                        disabled={translating}
                      >
                        {t('editEvent.saveTranslation', { defaultValue: 'Übersetzung speichern' })}
                      </Button>
                    </div>

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
            )}

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

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('events.location')}
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
              <div className="space-y-2">
                <Label>{t('createEvent.location', { defaultValue: 'Standort' })} *</Label>
                <div className="relative">
                  <Input
                    placeholder={t('createEvent.searchAddress', { defaultValue: 'Adresse suchen...' })}
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                  {locationResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {locationResults.map((result: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                          onClick={() => {
                            setLocationQuery(result.display_name)
                            setLocationResults([])
                            setFormData({
                              ...formData,
                              locationName: result.display_name,
                              location: {
                                type: 'Point',
                                coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
                              },
                            })
                          }}
                        >
                          📍 {result.display_name}
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

            {/* Fragen an Teilnehmer */}
            <div className="space-y-4">
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
                  {t('createEvent.questionsHint', { defaultValue: 'Pflichtfragen werden vor dem Ticketkauf gestellt. Optionale Fragen werden nach dem Kauf gestellt.' })}
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
                      onChange={(e) => updateQuestion(idx, { type: e.target.value as any })}
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

        {/* Gewinnspiel-Einstellungen — nur wenn das Event ein Gewinnspiel ist */}
        {(event as any)?.isRaffle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎰 {t('createEvent.isRaffle', { defaultValue: 'Gewinnspiel' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RaffleSettingsFields
                drawOnSite={raffleDrawOnSite}
                onDrawOnSiteChange={setRaffleDrawOnSite}
                notifyWinnerByEmail={raffleNotifyWinnerByEmail}
                onNotifyWinnerByEmailChange={setRaffleNotifyWinnerByEmail}
                partner={rafflePartner}
                onPartnerChange={setRafflePartner}
                partnerMarketing={rafflePartnerMarketing}
                onPartnerMarketingChange={setRafflePartnerMarketing}
                hasDrawDate={!!(event as any)?.raffleDrawDate}
              />
            </CardContent>
          </Card>
        )}

        {/* Sichtbarkeit — dieselbe Bedienung wie in CreateEvent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('createEvent.whoCanSee', { defaultValue: 'Wer kann das Event sehen?' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VisibilitySelector
              value={formData.visibility as EventVisibility}
              onChange={(next) => setFormData({ ...formData, visibility: next })}
            />
          </CardContent>
        </Card>

        {/* Eingeladene Personen — nur bei visibility 'selected'.
            Beim Umschalten auf öffentlich verschwindet der Abschnitt, die
            invitedUsers am Event bleiben aber unangetastet: buildEventFormData
            schickt das Feld nur, wenn tatsächlich jemand hinzugefügt wurde.
            Wer zurückschaltet, findet seine Liste deshalb wieder. */}
        {isSelectedVisibility && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('editEvent.invitedTitle', { defaultValue: 'Eingeladene Personen' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingInvitedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('editEvent.invitedNone', { defaultValue: 'Es wurde noch niemand eingeladen.' })}
                </p>
              ) : (
                <div className="space-y-2">
                  {existingInvitedUsers.map((invited) => (
                    <div key={getSubscriberId(invited)} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={invited.profileImage || ''} />
                        <AvatarFallback>
                          {invited.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {invited.name ||
                            t('editEvent.invitedUnknown', { defaultValue: 'Eingeladene Person' })}
                        </p>
                        {invited.username && (
                          <p className="text-sm text-muted-foreground truncate">@{invited.username}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {newlyInvitedUsers.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {t('editEvent.invitedPending', {
                      defaultValue: 'Wird mit dem Speichern eingeladen',
                    })}
                  </p>
                  {newlyInvitedUsers.map((invited) => (
                    <div key={getSubscriberId(invited)} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={invited.profileImage || ''} />
                        <AvatarFallback>
                          {invited.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {invited.name ||
                            t('editEvent.invitedUnknown', { defaultValue: 'Eingeladene Person' })}
                        </p>
                        {invited.username && (
                          <p className="text-sm text-muted-foreground truncate">@{invited.username}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <SubscriberPicker
                userId={organizerId}
                value={newInvitedUsers}
                onChange={setNewInvitedUsers}
                excludeUserIds={existingInvitedIds}
              />
            </CardContent>
          </Card>
        )}

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

        {/* Recurring — nur für einmalige Events */}
        {!(event as any)?.eventSeriesId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('createEvent.recurringEvent', { defaultValue: 'Wiederkehrendes Event' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {seriesConfig
                    ? seriesConfig.recurrence === 'weekly'
                      ? `Wöchentlich · ${seriesConfig.occurrences}x`
                      : seriesConfig.recurrence === 'monthly'
                      ? `Monatlich · ${seriesConfig.occurrences}x`
                      : seriesConfig.customLabel
                    : 'Einmalig'}
                </p>
                <div className="flex gap-2">
                  {seriesConfig && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSeriesConfig(null)}>
                      Entfernen
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowRecurringModal(true)}>
                    {seriesConfig ? 'Ändern' : 'Einrichten'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <RecurringEventModal
          open={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          onConfirm={(s) => setSeriesConfig({ ...s, occurrences: s.occurrences ?? 1 })}
          baseDate={formData.eventDate}
        />

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

          {(event as any)?.eventSeriesId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('editEvent.addDates', { defaultValue: 'Termine hinzufügen' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showAddDates ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowAddDates(true)
                      setNewDates([''])
                    }}
                  >
                    + {t('editEvent.addMoreDates', { defaultValue: 'Weitere Termine zur Serie hinzufügen' })}
                  </Button>
                ) : (
                  <>
                    {newDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
                          value={date}
                          onChange={(e) => handleDateChange(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDate(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleAddDate}
                    >
                      + {t('editEvent.addAnotherDate', { defaultValue: 'Weiteren Termin hinzufügen' })}
                    </Button>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setShowAddDates(false)
                          setNewDates([])
                        }}
                      >
                        {t('common.cancel', { defaultValue: 'Abbrechen' })}
                      </Button>
                      <Button
                        type="button"
                        variant="gradient"
                        size="sm"
                        className="flex-1"
                        onClick={handleSaveNewDates}
                        disabled={addingDates || newDates.every((d) => !d)}
                      >
                        {addingDates
                          ? t('common.saving', { defaultValue: 'Speichert...' })
                          : t('editEvent.saveDates', { defaultValue: 'Termine speichern' })}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
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
