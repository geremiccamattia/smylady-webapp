import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { eventsService } from '@/services/events'
import { ticketmasterService } from '@/services/ticketmaster'
import {
  isTicketmasterEnabled,
  setTicketmasterEnabled,
  getManualLocation,
  getCurrentLocation,
  isLiveLocationEnabled,
} from '@/services/location'
import EventCard from '@/components/events/EventCard'
import LocationModal, { LocationResult } from '@/components/LocationModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Ticket,
  MapPin,
  Navigation,
} from 'lucide-react'
import { EVENT_CATEGORIES, MUSIC_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Event } from '@/types'

// Fallback location (only used when geolocation is denied/unavailable and no saved location)
const FALLBACK_LOCATION: LocationResult = {
  place_id: 'vienna',
  description: 'Wien, Österreich',
  lat: 48.2082,
  lng: 16.3738,
}

export default function Explore() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedMusicType, setSelectedMusicType] = useState(searchParams.get('musicType') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [showTicketmaster, setShowTicketmaster] = useState(isTicketmasterEnabled())

  // Location state
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [radius, setRadius] = useState('25')
  const [locationLoaded, setLocationLoaded] = useState(false)

  // Load saved location on mount - prioritize: saved > live geolocation > auto-detect > fallback
  useEffect(() => {
    const loadLocation = async () => {
      try {
        // 1. Check for saved manual location
        const savedLocation = getManualLocation()
        if (savedLocation && savedLocation.lat && savedLocation.lng) {
          setSelectedLocation({
            place_id: 'saved',
            description: savedLocation.description || `${savedLocation.lat.toFixed(4)}, ${savedLocation.lng.toFixed(4)}`,
            lat: savedLocation.lat,
            lng: savedLocation.lng,
          })
          setLocationLoaded(true)
          return
        }

        // 2. Try browser geolocation (auto-detect user's actual location)
        try {
          const current = await getCurrentLocation()
          const detectedLocation: LocationResult = {
            place_id: 'current',
            description: `Aktueller Standort (${current.latitude.toFixed(4)}, ${current.longitude.toFixed(4)})`,
            lat: current.latitude,
            lng: current.longitude,
          }
          setSelectedLocation(detectedLocation)
          setLocationLoaded(true)
          return
        } catch {
          // Geolocation denied or unavailable - fall through to fallback
        }

        // 3. Fallback only when geolocation is not available
        setSelectedLocation(FALLBACK_LOCATION)
      } catch {
        setSelectedLocation(FALLBACK_LOCATION)
      } finally {
        setLocationLoaded(true)
      }
    }
    loadLocation()
  }, [])

  // Fetch platform events with location
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: [
      'events',
      'explore',
      isAuthenticated,
      searchQuery,
      selectedCategory,
      selectedMusicType,
      selectedLocation?.lat,
      selectedLocation?.lng,
      radius,
    ],
    queryFn: () =>
      isAuthenticated
        ? eventsService.getEvents(
            {
              search: searchQuery,
              category: selectedCategory,
              musicType: selectedMusicType,
              latitude: selectedLocation?.lat?.toString() || '',
              longitude: selectedLocation?.lng?.toString() || '',
              radius: radius,
            },
            true
          )
        : eventsService.getPublicEvents(
            {
              search: searchQuery,
              category: selectedCategory,
              musicType: selectedMusicType,
              latitude: selectedLocation?.lat?.toString() || '',
              longitude: selectedLocation?.lng?.toString() || '',
              radius: radius,
            },
            true
          ),
    enabled: locationLoaded,
  })

  // Fetch Ticketmaster events if enabled
  const { data: ticketmasterEvents, isLoading: loadingTicketmaster } = useQuery({
    queryKey: [
      'ticketmaster-events',
      searchQuery,
      selectedCategory,
      showTicketmaster,
      selectedLocation?.lat,
      selectedLocation?.lng,
      radius,
    ],
    queryFn: () =>
      ticketmasterService.getEvents(
        {
          search: searchQuery,
          category: selectedCategory,
          latitude: selectedLocation?.lat?.toString() || '',
          longitude: selectedLocation?.lng?.toString() || '',
          radius: radius,
        },
        true,
        false // Don't auto-detect location, we pass it explicitly
      ),
    enabled: showTicketmaster && locationLoaded && !!selectedLocation,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  // Combine events
  const allEvents: Event[] = [
    ...(events || []),
    ...(showTicketmaster && ticketmasterEvents
      ? ticketmasterEvents.map((e: Event) => ({ ...e, isTicketmaster: true }))
      : []),
  ]

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedMusicType) params.set('musicType', selectedMusicType)
    setSearchParams(params)
  }, [searchQuery, selectedCategory, selectedMusicType, setSearchParams])

  useEffect(() => {
    document.title = 'Events entdecken | Share Your Party'
    return () => {
      document.title = 'Share Your Party'
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'explore_search',
      has_category: !!selectedCategory,
      has_music_type: !!selectedMusicType,
    })
    refetch()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedMusicType('')
  }

  const handleLocationSelect = (location: LocationResult | null) => {
    setSelectedLocation(location || FALLBACK_LOCATION)
  }

  const handleTicketmasterToggle = (enabled: boolean) => {
    setShowTicketmaster(enabled)
    setTicketmasterEnabled(enabled)
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedMusicType

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {t('explore.title', { defaultValue: 'Events entdecken' })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('explore.subtitle', { defaultValue: 'Finde das perfekte Event für dich' })}
        </p>
      </div>

      {/* Location Selector Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card rounded-xl border">
        {/* Location Button */}
        <button
          onClick={() => setLocationModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex-1 min-w-[200px]"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="truncate text-sm">
            {selectedLocation?.description || t('explore.selectLocation', { defaultValue: 'Standort wählen' })}
          </span>
        </button>

        {/* Radius Dropdown */}
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 km</SelectItem>
            <SelectItem value="25">25 km</SelectItem>
            <SelectItem value="50">50 km</SelectItem>
            <SelectItem value="100">100 km</SelectItem>
          </SelectContent>
        </Select>

        {/* Live Location Indicator */}
        {isLiveLocationEnabled() && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Navigation className="h-3 w-3" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Ticketmaster Toggle */}
      <div className="flex items-center justify-between p-3 bg-card rounded-xl border">
        <div className="flex items-center gap-3">
          <Ticket className={`h-5 w-5 ${showTicketmaster ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <span className="font-medium text-sm">
              {t('explore.ticketmasterEvents', { defaultValue: 'Ticketmaster Events' })}
            </span>
            <p className="text-xs text-muted-foreground">
              {t('explore.ticketmasterDesc', { defaultValue: 'Zeige zusätzliche Events von Ticketmaster' })}
            </p>
          </div>
        </div>
        <Switch checked={showTicketmaster} onCheckedChange={handleTicketmasterToggle} />
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('explore.searchPlaceholder', { defaultValue: 'Events suchen...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">{t('common.search', { defaultValue: 'Suchen' })}</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-accent')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-card rounded-xl border space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t('explore.filters', { defaultValue: 'Filter' })}</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  {t('common.reset')}
                </Button>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('explore.category', { defaultValue: 'Kategorie' })}
              </label>
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat.value ? '' : cat.value)
                    }
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Music Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('explore.musicType', { defaultValue: 'Musikrichtung' })}
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSIC_TYPES.map((music) => (
                  <Button
                    key={music.value}
                    variant={selectedMusicType === music.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setSelectedMusicType(selectedMusicType === music.value ? '' : music.value)
                    }
                  >
                    {music.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('explore.activeFilters', { defaultValue: 'Aktive Filter:' })}
            </span>
            {searchQuery && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm flex items-center gap-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm flex items-center gap-1">
                {EVENT_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedMusicType && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm flex items-center gap-1">
                {MUSIC_TYPES.find((m) => m.value === selectedMusicType)?.label}
                <button onClick={() => setSelectedMusicType('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {!locationLoaded || isLoading || (showTicketmaster && loadingTicketmaster) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
          ))}
        </div>
      ) : allEvents && allEvents.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {allEvents.length} Event{allEvents.length !== 1 ? 's' : ''}{' '}
            {t('explore.found', { defaultValue: 'gefunden' })}
            {selectedLocation?.description && (
              <span className="ml-1">
                {t('explore.nearLocation', { defaultValue: 'in der Nähe von' })}{' '}
                {selectedLocation.description.split(',')[0]}
              </span>
            )}
            {showTicketmaster && ticketmasterEvents && ticketmasterEvents.length > 0 && (
              <span className="ml-1">
                ({t('explore.includingTicketmaster', { defaultValue: 'inkl.' })}{' '}
                {ticketmasterEvents.length} {t('explore.fromTicketmaster', { defaultValue: 'von Ticketmaster' })})
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((event) => (
              <EventCard key={event.id || event._id} event={event} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <Filter className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {t('events.noEvents')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t('events.noEventsHint')}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {t('explore.clearFilters', { defaultValue: 'Filter zurücksetzen' })}
              </Button>
            )}
            <Button variant="outline" onClick={() => setLocationModalOpen(true)}>
              <MapPin className="h-4 w-4 mr-2" />
              {t('events.changeLocation')}
            </Button>
          </div>
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelect={handleLocationSelect}
        initialLocation={selectedLocation}
      />
    </div>
  )
}
