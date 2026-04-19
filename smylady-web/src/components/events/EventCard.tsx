import { Link } from 'react-router-dom'
import { Heart, MapPin, Calendar, Clock, Users, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Event } from '@/types'
import { formatDate, formatPrice, cn, resolveImageUrl, generateEventSlug } from '@/lib/utils'
import { useState, useCallback } from 'react'
import { favoritesService } from '@/services/favorites'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

interface EventCardProps {
  event: Event
  onFavoriteChange?: (eventId: string, isFavorite: boolean) => void
}

export default function EventCard({ event, onFavoriteChange }: EventCardProps) {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [isFavorite, setIsFavorite] = useState(event.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const eventId = event.id || event._id
  // Handle different image structures: locationImages array with url property, or direct images array
  // Priority: locationImages[0].url > thumbnailUrl > images[0]
  const rawImageUrl = event.locationImages?.[0]?.url || event.thumbnailUrl || event.images?.[0]

  // Generate a unique placeholder based on event ID to avoid all events showing the same fallback
  const uniquePlaceholder = `https://via.placeholder.com/400x225/6366f1/ffffff?text=${encodeURIComponent(event.name?.substring(0, 15) || 'Event')}`
  const imageUrl = resolveImageUrl(rawImageUrl) || uniquePlaceholder

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    (e.target as HTMLImageElement).src = uniquePlaceholder
  }, [uniquePlaceholder])

  // Check if this is a Ticketmaster/external event
  const isExternalEvent = event.isTicketmaster || event.isExternalEvent || event.source === 'ticketmaster'
  const externalUrl = event.ticketmasterUrl || event.externalUrl

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Nicht angemeldet',
        description: 'Bitte melde dich an um Events zu favorisieren.',
      })
      return
    }

    setIsLoading(true)
    try {
      // Prepare options for Ticketmaster events
      const options = event.isTicketmaster ? {
        isTicketmaster: true,
        ticketmasterEventData: {
          name: event.name,
          startDate: event.eventDate?.toString() || event.startDate?.toString() || new Date().toISOString(),
          location: event.locationName || event.venue?.name || '',
          imageUrl: imageUrl,
          ticketmasterUrl: event.ticketmasterUrl || '',
        }
      } : undefined

      const result = await favoritesService.toggleFavorite(eventId!, options)
      const newFavoriteStatus = result.data?.isFavorite ?? !isFavorite
      setIsFavorite(newFavoriteStatus)
      onFavoriteChange?.(eventId!, newFavoriteStatus)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Konnte nicht zu Favoriten hinzufügen.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const numericPrice = typeof event.price === 'string' ? parseFloat(event.price) || 0 : (event.price || 0)
  const availableTickets = (() => {
    const tiers = (event as any).ticketTiers
    if (tiers && tiers.length > 0) {
      // Sum remaining capacity across all tiers that have a quantity set
      const tiersWithQuantity = tiers.filter((t: any) => t.quantity != null)
      if (tiersWithQuantity.length > 0) {
        return tiersWithQuantity.reduce(
          (sum: number, t: any) => sum + Math.max(0, t.quantity - (t.soldCount || 0)),
          0
        )
      }
      // If no tiers have quantity set, fall back to event-level
    }
    return event.availableTickets ?? ((event.totalTickets || 0) - (event.soldTickets || 0))
  })()
  // Use the backend's soldOut flag as the primary source of truth.
  // Only fall back to availableTickets check when totalTickets is explicitly set (> 0)
  const isSoldOut = !isExternalEvent && (
    event.soldOut === true ||
    (event.totalTickets > 0 && availableTickets <= 0)
  )

  // Handle click for external events - open in new tab
  const handleExternalClick = (e: React.MouseEvent) => {
    if (isExternalEvent && externalUrl) {
      e.preventDefault()
      window.open(externalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Determine the price display text
  const getPriceDisplay = () => {
    if (isExternalEvent) {
      return t('event.priceOnWebsite', { defaultValue: 'Preis auf Website' })
    }
    // If event has ticket tiers, show "Ab X" with the lowest tier price
    const tiers = (event as any).ticketTiers
    if (tiers && tiers.length > 0) {
      const minPrice = Math.min(...tiers.map((t: any) => t.price))
      return `Ab ${formatPrice(minPrice)}`
    }
    return numericPrice > 0 ? formatPrice(numericPrice) : t('event.free', { defaultValue: 'Kostenlos' })
  }

  // Card content - same for both link types
  const cardContent = (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {/* Skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={imageUrl}
          alt={event.name}
          className={cn(
            "w-full h-full object-cover group-hover:scale-105 transition-all duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="eager"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {/* External Event Badge */}
        {isExternalEvent && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Ticketmaster
          </div>
        )}
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 bg-white/80 hover:bg-white",
            isFavorite && "text-red-500"
          )}
          onClick={handleFavoriteClick}
          disabled={isLoading}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </Button>
        {/* Price Badge */}
        <div className={cn(
          "absolute bottom-2 left-2 px-3 py-1 rounded-full text-white text-sm font-semibold",
          isExternalEvent ? "bg-blue-600" : "gradient-bg"
        )}>
          {getPriceDisplay()}
        </div>
        {/* Sold Out Badge */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
              {t('event.soldOut', { defaultValue: 'Ausverkauft' })}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{event.eventDate ? formatDate(event.eventDate) : '-'}</span>
          </div>
          {event.eventStartTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {event.eventStartTime.includes('T')
                  ? new Date(event.eventStartTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                  : event.eventStartTime}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{event.locationName || event.venue?.name}</span>
        </div>

        {/* Tickets - hide for external/Ticketmaster events */}
        {!isExternalEvent && !isSoldOut && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{availableTickets} {t('event.ticketsAvailable', { defaultValue: 'Tickets verfügbar' })}</span>
          </div>
        )}

        {/* External Event Info */}
        {isExternalEvent && (
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <ExternalLink className="h-4 w-4" />
            <span>{t('event.externalEventInfo', { defaultValue: 'Tickets auf Ticketmaster.de' })}</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.category && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
              {event.category}
            </span>
          )}
          {event.musicType && (
            <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-medium">
              {event.musicType}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // For external events, use an anchor tag that opens in a new window
  // For internal events, use React Router Link
  if (isExternalEvent && externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleExternalClick}
        className="block"
      >
        {cardContent}
      </a>
    )
  }

  return (
    <Link to={`/event/${generateEventSlug(event.name, eventId!)}`}>
      {cardContent}
    </Link>
  )
}
