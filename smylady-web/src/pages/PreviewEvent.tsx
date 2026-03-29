import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { eventsService } from '@/services/events'
import { Event } from '@/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Euro,
  AlertCircle,
  PartyPopper,
  Edit,
  Share2,
  ArrowLeft,
} from 'lucide-react'

export default function PreviewEvent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return
      try {
        const data = await eventsService.getEventById(id)
        setEvent(data)
      } catch (error) {
        console.error('Error fetching event:', error)
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: 'Event konnte nicht geladen werden.',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id, toast])

  const handleShare = async () => {
    const shareUrl = `https://app.shareyourparty.de/redirect/event/${id}`
    const shareText = `🎉 Du bist eingeladen zu: ${event?.name}\n#ShareYourParty`

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.name,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error
        copyToClipboard(shareUrl)
      }
    } else {
      // Fallback: Copy to clipboard
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Link kopiert!',
      description: 'Der Event-Link wurde in die Zwischenablage kopiert.',
    })
  }

  const handleEdit = () => {
    navigate(`/edit-event/${id}`)
  }

  const isLessThanTwoDays = event?.eventDate
    ? new Date(event.eventDate).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000
    : false

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Event nicht gefunden</h2>
        <p className="text-muted-foreground mt-2">Das Event existiert nicht oder wurde gelöscht.</p>
        <Button className="mt-4" onClick={() => navigate('/my-events')}>
          Zurück zu meinen Events
        </Button>
      </div>
    )
  }

  const eventImage = event.locationImages?.[0]?.url || event.images?.[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/my-events')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Event Vorschau</h1>
      </div>

      {/* Event Image */}
      {eventImage && (
        <div className="relative aspect-video rounded-xl overflow-hidden">
          <img
            src={eventImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Details */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Name */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold text-lg">{event.name}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Uhrzeit</p>
              <p className="font-medium">{event.eventStartTime || '—'}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Datum</p>
              <p className="font-medium">
                {event.eventDate
                  ? format(new Date(event.eventDate), 'dd.MM.yyyy', { locale: de })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{event.locationName || '—'}</p>
            </div>
          </div>

          {/* Restrictions */}
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Einschränkungen</p>
              <p className="font-medium">{event.restrictions || '—'}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <Euro className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Preis</p>
              <p className="font-medium">
                {event.price === 0 ? 'Kostenlos' : `${event.price}€`}
              </p>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Gäste</p>
              <p className="font-medium">{event.soldTickets || 0}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Beschreibung</p>
            <p className="text-sm">{event.description || '—'}</p>
          </div>

          {/* Party Type */}
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Party-Typ</p>
              <p className="font-medium">{event.partyType || event.category || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button className="w-full" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Event teilen
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleEdit}
          disabled={isLessThanTwoDays}
        >
          <Edit className="h-4 w-4 mr-2" />
          Event bearbeiten
        </Button>

        {isLessThanTwoDays && (
          <p className="text-xs text-center text-muted-foreground">
            Das Event kann nicht mehr bearbeitet werden, da es in weniger als 2 Tagen stattfindet.
          </p>
        )}
      </div>
    </div>
  )
}
