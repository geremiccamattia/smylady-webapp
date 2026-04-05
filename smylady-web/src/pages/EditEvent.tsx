import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { useToast } from '@/hooks/use-toast'
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
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  
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
        eventStartTime: event.eventStartTime || '',
        eventEndTime: event.eventEndTime || '',
        locationName: event.locationName || '',
        minimumAge: event.minimumAge?.toString() || '0',
        offerings: Array.isArray(event.offerings) ? event.offerings.join(', ') : (event.offerings || ''),
        restrictions: Array.isArray(event.restrictions) ? event.restrictions.join(', ') : (event.restrictions || ''),
        visibility: event.visibility || 'public',
      })
      
      // Set existing images
      if (event.images && event.images.length > 0) {
        setExistingImages(event.images)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const eventFormData = new FormData()
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        eventFormData.append(key, value)
      })

      // Add existing images to keep
      eventFormData.append('existingImages', JSON.stringify(existingImages))

      // Add location as JSON
      if (event?.location) {
        eventFormData.append('location', JSON.stringify(event.location))
      }

      // Add new images
      images.forEach(image => {
        eventFormData.append('files', image)
      })

      await eventsService.updateEvent(id!, eventFormData)

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'update_event' })

      toast({
        title: t('editEvent.updateSuccess'),
        description: t('editEvent.changesSaved'),
      })

      navigate(`/event/${id}`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('editEvent.updateFailed'),
      })
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
                  required
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
                  required
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
                  required
                />
              </div>
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
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('editEvent.saveChanges')}
          </Button>
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
