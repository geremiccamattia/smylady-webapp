'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLocalePath } from '@/hooks/useLocalePath'
import { communityService } from '@/services/community'
import EventCard from '@/components/events/EventCard'
import LocationModal, { LocationResult } from '@/components/LocationModal'
import { getManualLocation, getCurrentLocation, isLiveLocationEnabled } from '@/services/location'
import { generateCommunitySlug } from '@/lib/utils'

interface CommunityEventsPageProps {
  communityId: string
}

// Fallback location (only used when geolocation is denied/unavailable and no saved location)
const FALLBACK_LOCATION: LocationResult = {
  place_id: 'vienna',
  description: 'Wien, Österreich',
  lat: 48.2082,
  lng: 16.3738,
}

export default function CommunityEventsPage({ communityId }: CommunityEventsPageProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const localePath = useLocalePath()

  const [dateFilter, setDateFilter] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [radius, setRadius] = useState('50')
  const [locationLoaded, setLocationLoaded] = useState(false)

  // Load saved location on mount - prioritize: saved > live geolocation > fallback (same as Explore)
  useEffect(() => {
    const loadLocation = async () => {
      try {
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

        try {
          const current = await getCurrentLocation()
          setSelectedLocation({
            place_id: 'current',
            description: `Aktueller Standort (${current.latitude.toFixed(4)}, ${current.longitude.toFixed(4)})`,
            lat: current.latitude,
            lng: current.longitude,
          })
          setLocationLoaded(true)
          return
        } catch {
          // Geolocation denied or unavailable - fall through to fallback
        }

        setSelectedLocation(FALLBACK_LOCATION)
      } catch {
        setSelectedLocation(FALLBACK_LOCATION)
      } finally {
        setLocationLoaded(true)
      }
    }
    loadLocation()
  }, [])

  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => communityService.getById(communityId),
  })

  const { data: events, isLoading } = useQuery({
    queryKey: ['communityEvents', communityId, dateFilter, selectedLocation?.lat, selectedLocation?.lng, radius],
    queryFn: () =>
      communityService.getEvents(communityId, {
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lng,
        radius: parseInt(radius, 10),
        date: dateFilter || undefined,
      }),
    enabled: locationLoaded,
  })

  const allEvents = events || []
  const topPicks = allEvents.slice(0, 3)

  const dateFilters = [
    { key: '', label: t('common.all', { defaultValue: 'Alle' }) },
    { key: 'today', label: t('explore.dateToday', { defaultValue: 'Heute' }) },
    { key: 'tomorrow', label: t('explore.dateTomorrow', { defaultValue: 'Morgen' }) },
    { key: 'weekend', label: t('explore.dateWeekend', { defaultValue: 'Wochenende' }) },
    { key: 'week', label: t('explore.dateThisWeek', { defaultValue: 'Diese Woche' }) },
  ]

  const handleLocationSelect = (location: LocationResult | null) => {
    setSelectedLocation(location || FALLBACK_LOCATION)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push(localePath(`/communities/${community?.name ? generateCommunitySlug(community.name, communityId) : communityId}`))}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back', { defaultValue: 'Zurück' })}
      </button>

      <h1 className="text-2xl font-bold">
        {t('community.communityEvents', { defaultValue: 'Community Events' })}
      </h1>
      {community?.name && (
        <p className="text-muted-foreground mt-1">{community.name}</p>
      )}

      {/* Location Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card rounded-xl border mt-6">
        <button
          onClick={() => setLocationModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex-1 min-w-[200px]"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="truncate text-sm">
            {selectedLocation?.description || t('explore.selectLocation', { defaultValue: 'Standort wählen' })}
          </span>
        </button>
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
        {isLiveLocationEnabled() && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Navigation className="h-3 w-3" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Date Filter Chips */}
      <div className="mt-4 space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('explore.dateLabel', { defaultValue: 'Wann' })}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dateFilters.map((d) => (
            <button
              key={d.key}
              onClick={() => setDateFilter(d.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                dateFilter === d.key
                  ? 'bg-primary text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Community Event (members only) */}
      {community?.isMember && (
        <div className="flex justify-center my-6">
          <Link href={localePath(`/create-event?communityId=${communityId}`)}>
            <Button variant="gradient">
              {t('community.createEvent', { defaultValue: 'Community Event erstellen' })}
            </Button>
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-8 mt-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : allEvents.length > 0 ? (
        <div className="space-y-10 mt-6">
          {/* Top Pick */}
          {topPicks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight">
                🔥 {t('community.topPick', { defaultValue: 'Top Pick' })}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                {topPicks.map((event: any) => (
                  <div key={event._id} className="flex-shrink-0 w-[70vw] md:w-auto">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Community Events */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight">
              {t('community.allCommunityEvents', { defaultValue: 'Alle Community Events' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allEvents.map((event: any) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {t('community.noEvents', { defaultValue: 'Noch keine Events in dieser Community.' })}
          </p>
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
