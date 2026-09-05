'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { eventsService } from '@/services/events'
import { userService } from '@/services/user'
import { apiClient, publicClient } from '@/services/api'
import { ticketmasterService } from '@/services/ticketmaster'
import { communityService } from '@/services/community'
import CommunityCard from '@/components/community/CommunityCard'
import { RaffleEventCard } from '@/components/RaffleEventCard'
import { RafflePromoBanner } from '@/components/RafflePromoBanner'
import {
  getManualLocation,
  getCurrentLocation,
  isLiveLocationEnabled,
} from '@/services/location'
import Link from 'next/link'
import ScrollSignupPrompt from '@/components/ScrollSignupPrompt'
import EventCard from '@/components/events/EventCard'
import LocationModal, { LocationResult } from '@/components/LocationModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  MapPin,
  Navigation,
  ChevronRight,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { resolveImageUrl } from '@/lib/utils'
import { isRaffleOpen } from '@/lib/raffle'
import { postsService } from '@/services/posts'
import { Event } from '@/types'

interface SpotlightAd {
  _id: string
  headline: string
  description: string
  imageUrl: string
  targetUrl: string
  locationLabel?: string
  categoryLabel?: string
}

// Fallback location (only used when geolocation is denied/unavailable and no saved location)
const FALLBACK_LOCATION: LocationResult = {
  place_id: 'vienna',
  description: 'Wien, Österreich',
  lat: 48.2082,
  lng: 16.3738,
}

function ExploreContent() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [submittedSearch, setSubmittedSearch] = useState(searchParams.get('search') || '')
  const [searchTrigger, setSearchTrigger] = useState(0)
  const searchRef = useRef(submittedSearch)
  const allEventsRef = useRef<HTMLDivElement>(null)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '')
  const [priceFilter, setPriceFilter] = useState(searchParams.get('price') || '')
  const [scrollToAll, setScrollToAll] = useState(0)
  const [customDate, setCustomDate] = useState<string>('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [fullscreenMemory, setFullscreenMemory] = useState<string | null>(null)
  const showTicketmaster = true

  // Location state
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [radius, setRadius] = useState('50')
  const [locationLoaded, setLocationLoaded] = useState(false)

  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (urlSearch !== submittedSearch) {
      searchRef.current = urlSearch
      setSearchQuery(urlSearch)
      setSubmittedSearch(urlSearch)
      setSearchTrigger(prev => prev + 1)
    }
  }, [searchParams])

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
  const { data: events, isLoading } = useQuery({
    queryKey: [
      'events',
      'explore',
      isAuthenticated,
      searchTrigger,
      submittedSearch,
      selectedCategory,
      selectedLocation?.lat,
      selectedLocation?.lng,
      radius,
    ],
    queryFn: () => {
      const catParam = selectedCategory === 'all' ? '' : selectedCategory
      return isAuthenticated
        ? eventsService.getEvents(
            {
              search: searchRef.current,
              category: catParam,
              latitude: selectedLocation?.lat?.toString() || '',
              longitude: selectedLocation?.lng?.toString() || '',
              radius: radius,
            },
            true
          )
        : eventsService.getPublicEvents(
            {
              search: searchRef.current,
              category: catParam,
              latitude: selectedLocation?.lat?.toString() || '',
              longitude: selectedLocation?.lng?.toString() || '',
              radius: radius,
            },
            true
          )
    },
    enabled: locationLoaded,
    staleTime: 0,
    gcTime: 0,
  })

  // Fetch Ticketmaster events if enabled
  const { data: ticketmasterEvents, isLoading: loadingTicketmaster } = useQuery({
    queryKey: [
      'ticketmaster-events',
      submittedSearch,
      selectedCategory,
      showTicketmaster,
      selectedLocation?.lat,
      selectedLocation?.lng,
      radius,
    ],
    queryFn: () =>
      ticketmasterService.getEvents(
        {
          search: submittedSearch,
          category: selectedCategory,
          latitude: selectedLocation?.lat?.toString() || '',
          longitude: selectedLocation?.lng?.toString() || '',
          radius: radius,
        },
        true,
        false // Don't auto-detect location, we pass it explicitly
      ),
    enabled: showTicketmaster && locationLoaded && !!selectedLocation && !submittedSearch,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const allEventIds = useMemo(() => {
    if (!events) return []
    return (events as any[])
      .filter((e) => !e.isTicketmaster && !e.isExternalEvent)
      .map((e) => e._id || e.id)
      .filter(Boolean)
  }, [events])

  const { data: attendeePreviews = {} } = useQuery({
    queryKey: ['attendeePreviews', allEventIds],
    queryFn: () => eventsService.getAttendeePreviews(allEventIds),
    enabled: allEventIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const { data: recentMemories = [] } = useQuery({
    queryKey: ['recentMemories'],
    queryFn: () => eventsService.getRecentMemories(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: latestPostsData } = useQuery({
    queryKey: ['latestPosts'],
    queryFn: () => postsService.getPublicFeed(1),
    staleTime: 5 * 60 * 1000,
  })
  const latestPosts = ((latestPostsData as any)?.posts || (latestPostsData as any)?.data?.posts || []).slice(0, 10)

  const { data: topPicks = [] } = useQuery({
    queryKey: ['topPicks', selectedLocation?.lat, selectedLocation?.lng],
    queryFn: () => eventsService.getTopPicks(
      selectedLocation?.lat || 0,
      selectedLocation?.lng || 0,
    ),
    enabled: locationLoaded && !!selectedLocation,
    staleTime: 10 * 60 * 1000,
  })

  const { data: topCommunities } = useQuery({
    queryKey: ['communityTopPicks'],
    queryFn: () => communityService.getTopPicks(3),
    staleTime: 10 * 60 * 1000,
  })

  const { data: raffleEvents } = useQuery({
    queryKey: ['raffleEvents', selectedLocation?.lat, selectedLocation?.lng, radius],
    queryFn: async () => {
      // publicClient + /events/public statt apiClient + /events: /events ist
      // auth-pflichtig (401 ohne Token) — gleiches Muster wie RafflePromoBanner.tsx.
      const response = await publicClient.get('/events/public', {
        params: {
          isRaffle: true,
          upcoming: true,
          latitude: selectedLocation?.lat,
          longitude: selectedLocation?.lng,
          radius,
        },
      })
      const list = response.data?.data?.events || response.data?.data || []
      // Der Endpoint filtert nur auf isRaffle, nicht auf den Status — ausgeloste
      // Gewinnspiele fallen deshalb hier heraus. Siehe Hinweis zum Backend im Bericht.
      return (list as any[]).filter((e) => isRaffleOpen(e))
    },
    enabled: locationLoaded && !!selectedLocation,
    staleTime: 5 * 60 * 1000,
  })

  const filteredEvents = useMemo(() => {
    const allEvents: Event[] = [
      ...(events || []),
      ...(showTicketmaster && ticketmasterEvents
        ? ticketmasterEvents.map((e: Event) => ({ ...e, isTicketmaster: true }))
        : []),
    ]

    const isFilterActive =
      (dateFilter && dateFilter !== 'all') ||
      (priceFilter && priceFilter !== 'all') ||
      (selectedCategory && selectedCategory !== 'all')

    let result: Event[]
    if (isFilterActive) {
      result = [...allEvents]
    } else {
      const topPickIds = new Set(topPicks.map((e: any) => e._id))
      result = allEvents.filter((e: any) => !topPickIds.has(e._id))
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
      let from: Date | null = null
      let to: Date | null = null
      switch (dateFilter) {
        case 'today':
          from = startOfDay(now); to = endOfDay(now); break
        case 'tomorrow': {
          const tomorrow = new Date(now)
          tomorrow.setDate(now.getDate() + 1)
          from = startOfDay(tomorrow); to = endOfDay(tomorrow); break
        }
        case 'weekend': {
          const day = now.getDay() // 0=So, 1=Mo, ..., 5=Fr, 6=Sa
          let friday: Date, sunday: Date
          if (day === 0) {
            // Sonntag: Wochenende ist Fr-So dieser Woche (Fr war vor 2 Tagen)
            friday = new Date(now); friday.setDate(now.getDate() - 2)
            sunday = new Date(now)
          } else if (day === 6) {
            // Samstag: Fr war gestern, So ist morgen
            friday = new Date(now); friday.setDate(now.getDate() - 1)
            sunday = new Date(now); sunday.setDate(now.getDate() + 1)
          } else if (day === 5) {
            // Freitag: heute bis Sonntag
            friday = new Date(now)
            sunday = new Date(now); sunday.setDate(now.getDate() + 2)
          } else {
            // Mo-Do: nächstes Wochenende (Fr-So)
            friday = new Date(now); friday.setDate(now.getDate() + (5 - day))
            sunday = new Date(friday); sunday.setDate(friday.getDate() + 2)
          }
          from = startOfDay(friday); to = endOfDay(sunday); break
        }
        case 'this_week': {
          const day = now.getDay()
          const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
          const sundayEnd = new Date(monday); sundayEnd.setDate(monday.getDate() + 6)
          from = startOfDay(now); to = endOfDay(sundayEnd); break
        }
        case 'next_week': {
          const day = now.getDay()
          const nextMonday = new Date(now); nextMonday.setDate(now.getDate() + (day === 0 ? 1 : 8 - day))
          const nextSunday = new Date(nextMonday); nextSunday.setDate(nextMonday.getDate() + 6)
          from = startOfDay(nextMonday); to = endOfDay(nextSunday); break
        }
        case 'this_month':
          from = startOfDay(now)
          to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          break
        case 'custom': {
          if (customDate) {
            const selected = new Date(customDate)
            from = startOfDay(selected)
            to = endOfDay(selected)
          }
          break
        }
      }
      if (from && to) {
        result = result.filter((e: any) => {
          const eventDate = new Date(e.eventStartTime || e.eventDate)
          return eventDate >= from! && eventDate <= to!
        })
      }
    }

    if (priceFilter && priceFilter !== 'all') {
      result = result.filter((e: any) => {
        // Chip "Gewinnspiel" zeigt nur noch offene — ausgeloste sind keine Teilnahme mehr wert
        if (priceFilter === 'raffle') return !!e.isRaffle && isRaffleOpen(e)
        if (e.isTicketmaster || e.isExternalEvent) return true
        switch (priceFilter) {
          case 'free': return (e.price === 0 || !e.price) && e.paymentType !== 'door'
          case 'paid': return e.price > 0 && e.paymentType !== 'door'
          case 'door': return e.paymentType === 'door'
          case 'online': return e.locationType === 'online'
          default: return true
        }
      })
    }

    if (submittedSearch) {
      result = result.filter((e: any) => !e.isTicketmaster && !e.isExternalEvent)
    }

    return result
  }, [events, ticketmasterEvents, showTicketmaster, dateFilter, priceFilter, customDate, topPicks, selectedCategory, submittedSearch])

  // === SECTION-BASED FEED ===

  const feedStats = useMemo(() => {
    const upcoming = filteredEvents || []
    const freeCount = upcoming.filter((e: any) =>
      !e.isTicketmaster && !e.isExternalEvent && (e.price === 0 || !e.price) && e.paymentType !== 'door'
    ).length
    const withAttendees = upcoming.filter((e: any) => (e.soldTickets || 0) > 0).length
    return { total: upcoming.length, free: freeCount, withAttendees }
  }, [filteredEvents])

  /**
   * Bezahlt platzierte Events — eigene Sektion, bewusst KEINE Doppelanzeige.
   *
   * Sie werden aus allen folgenden Sektionen ausgeschlossen (siehe usedIds
   * weiter unten). Ein bezahltes Event in „Kostenlos starten" stünde in einem
   * Kontext, der nach redaktioneller Auswahl aussieht — genau diese Vermischung
   * soll bezahlte Platzierung nicht erzeugen. In „Alle Events" bleiben sie
   * enthalten, das ist die Vollliste.
   *
   * Bedingung wie im Backend (boost-ranking.util.ts): aktiver Status und
   * Enddatum in der Zukunft. Kein Radius-Vergleich mehr.
   */
  const boostedEvents = useMemo(() => {
    const topPickIds = new Set(topPicks.map((e: any) => e._id))
    const now = new Date()
    return (filteredEvents || [])
      .filter((e: any) => {
        const eid = e._id || e.id
        return (
          !topPickIds.has(eid) &&
          e.boostStatus === 'active' &&
          e.boostEndDate &&
          new Date(e.boostEndDate) > now
        )
      })
      .slice(0, 3)
  }, [filteredEvents, topPicks])

  const doorEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...boostedEvents.map((e: any) => e._id || e.id),
    ])
    return (filteredEvents || [])
      .filter((e: any) => {
        const eid = e._id || e.id
        return !e.isTicketmaster && !usedIds.has(eid) && e.paymentType === 'door'
      })
      .sort((a: any, b: any) =>
        new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
      )
      .slice(0, 3)
  }, [filteredEvents, topPicks, boostedEvents])

  const freeEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...boostedEvents.map((e: any) => e._id || e.id),
      ...doorEvents.map((e: any) => e._id || e.id),
    ])
    return (filteredEvents || [])
      .filter((e: any) => {
        const eid = e._id || e.id
        return !e.isTicketmaster && !usedIds.has(eid) &&
          (e.price === 0 || !e.price) && e.paymentType !== 'door'
      })
      .sort((a: any, b: any) =>
        new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
      )
      .slice(0, 3)
  }, [filteredEvents, topPicks, boostedEvents, doorEvents])

  const onlineEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...boostedEvents.map((e: any) => e._id || e.id),
      ...doorEvents.map((e: any) => e._id || e.id),
      ...freeEvents.map((e: any) => e._id || e.id),
    ])
    return (filteredEvents || [])
      .filter((e: any) => {
        const eid = e._id || e.id
        return !usedIds.has(eid) && e.locationType === 'online'
      })
      .sort((a: any, b: any) =>
        new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
      )
      .slice(0, 3)
  }, [filteredEvents, topPicks, boostedEvents, doorEvents, freeEvents])

  const categoriesWithEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...boostedEvents.map((e: any) => e._id || e.id),
      ...doorEvents.map((e: any) => e._id || e.id),
      ...freeEvents.map((e: any) => e._id || e.id),
      ...onlineEvents.map((e: any) => e._id || e.id),
    ])
    const remaining = (filteredEvents || []).filter((e: any) => !usedIds.has(e._id || e.id))
    const categoryMap = new Map<string, any[]>()
    remaining.forEach((e: any) => {
      const cat = e.category || 'Other'
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      const arr = categoryMap.get(cat)!
      if (arr.length < 3) arr.push(e)
    })
    return Array.from(categoryMap.entries())
      .filter(([_, evs]) => evs.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
  }, [filteredEvents, topPicks, boostedEvents, doorEvents, freeEvents, onlineEvents])

  // Kein Ausschluss geboosteter Events: „Alle Events" ist die Vollliste, dort
  // gehören sie hinein — die Sortierung des Backends stellt sie ohnehin nach vorne.
  const remainingEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...doorEvents.map((e: any) => e._id || e.id),
      ...freeEvents.map((e: any) => e._id || e.id),
      ...onlineEvents.map((e: any) => e._id || e.id),
      ...categoriesWithEvents.flatMap(([_, evs]) => evs.map((e: any) => e._id || e.id)),
    ])
    return (filteredEvents || [])
      .filter((e: any) => !usedIds.has(e._id || e.id))
      .sort((a: any, b: any) =>
        new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
      )
  }, [filteredEvents, topPicks, doorEvents, freeEvents, onlineEvents, categoriesWithEvents])

  useEffect(() => {
    const params = new URLSearchParams()
    if (submittedSearch) params.set('search', submittedSearch)
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
    if (dateFilter && dateFilter !== 'all') params.set('date', dateFilter)
    if (priceFilter && priceFilter !== 'all') params.set('price', priceFilter)
    const newUrl = pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState(null, '', newUrl)
  }, [submittedSearch, selectedCategory, dateFilter, priceFilter])

  useEffect(() => {
    return () => {
    }
  }, [])

  useEffect(() => {
    if (scrollToAll > 0) {
      const timer = setTimeout(() => {
        allEventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [scrollToAll, filteredEvents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'explore_search',
      has_category: !!selectedCategory,
    })
    searchRef.current = searchQuery
    setSubmittedSearch(searchQuery)
    setSearchTrigger(prev => prev + 1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSubmittedSearch('')
    setSelectedCategory('')
    setDateFilter('')
    setPriceFilter('')
    setCustomDate('')
    setShowDatePicker(false)
  }

  const scrollToAllEvents = (filters: { priceFilter?: string; dateFilter?: string; selectedCategory?: string }) => {
    setPriceFilter(filters.priceFilter || 'all')
    setDateFilter(filters.dateFilter || 'all')
    setSelectedCategory(filters.selectedCategory || 'all')
    setScrollToAll(prev => prev + 1)
  }

  const handleLocationSelect = (location: LocationResult | null) => {
    setSelectedLocation(location || FALLBACK_LOCATION)
  }

  const isFilterActive = submittedSearch ||
    (dateFilter && dateFilter !== 'all') ||
    (priceFilter && priceFilter !== 'all') ||
    (selectedCategory && selectedCategory !== 'all')

  const hasActiveFilters = isFilterActive

  const getCategoryLink = (category: string) => {
    const categoryPageMap: Record<string, string> = {
      'Clubbing': '/events/clubbing-wien',
      'Music': '/events/konzerte-wien',
      'Business': '/events/business-events-wien',
      'Workshop': '/events/workshops-wien',
    }
    return categoryPageMap[category] || `/explore?category=${encodeURIComponent(category)}`
  }

  const EventSection = ({ title, events, onShowAll }: {
    title: string
    events: any[]
    onShowAll?: () => void
  }) => {
    if (events.length === 0) return null
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {onShowAll && (
            <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={onShowAll}>
              {t('explore.viewAll', { defaultValue: 'Alle anzeigen' })}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 3).map((event: any) => (
            <EventCard
              key={event._id || event.id}
              event={event}
              attendees={attendeePreviews?.[(event._id || event.id) as string] || []}
            />
          ))}
        </div>
      </div>
    )
  }

  const PostRow = ({ posts }: { posts: any[] }) => {
    if (posts.length === 0) return null

    const TEXT_CARD_COLORS = ['#FFF0F6', '#F0F4FF', '#F0FFF4', '#FFFBF0', '#F5F0FF']

    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">
          💭 {t('explore.yourVibes', { defaultValue: 'Deine Vibes' })}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
          {posts.slice(0, 3).map((post: any, index: number) => {
            const author = post.userId || post.user || {}
            const firstImage = post.media?.find((m: any) => m.type === 'image')
            const firstVideo = post.media?.find((m: any) => m.type === 'video')
            const postImage = firstImage?.url || post.images?.[0]?.url || post.images?.[0]
            const spotifyTrack = post.spotifyTrack
            const isSpotifyPost = !postImage && !firstVideo && !!spotifyTrack
            const isTextOnly = !postImage && !firstVideo && !isSpotifyPost
            const postText = post.text || post.content || ''
            const postId = post._id || post.id

            return (
              <Link
                key={postId}
                href={`/feed#post-${postId}`}
                className="flex-shrink-0 w-[70vw] md:w-auto"
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  {/* Bild-Post */}
                  {postImage && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={resolveImageUrl(postImage)}
                        alt=""
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Video-Post */}
                  {!postImage && firstVideo && (
                    <div className="aspect-[16/9] relative overflow-hidden bg-gray-900 flex items-center justify-center">
                      {firstVideo.thumbnailUrl ? (
                        <>
                          <img
                            src={resolveImageUrl(firstVideo.thumbnailUrl)}
                            alt=""
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                              <span className="text-white text-lg ml-0.5">▶</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                          <span className="text-white text-lg ml-0.5">▶</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spotify-Post */}
                  {isSpotifyPost && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {spotifyTrack.albumCover ? (
                        <img
                          src={spotifyTrack.albumCover}
                          alt={spotifyTrack.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1DB954] flex items-center justify-center">
                          <span className="text-3xl">🎵</span>
                        </div>
                      )}
                      {/* Spotify Badge */}
                      <div className="absolute top-2 right-2 bg-[#1DB954] rounded-full w-6 h-6 flex items-center justify-center">
                        <span className="text-white text-xs">♪</span>
                      </div>
                      {/* Track Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                        <p className="text-white text-xs font-bold truncate">{spotifyTrack.name}</p>
                        <p className="text-white/80 text-[10px] truncate">{spotifyTrack.artist}</p>
                      </div>
                    </div>
                  )}

                  {/* Text-only Post */}
                  {isTextOnly && (
                    <div
                      className="aspect-[16/9] flex flex-col items-center justify-center p-4"
                      style={{ backgroundColor: TEXT_CARD_COLORS[index % TEXT_CARD_COLORS.length] }}
                    >
                      <span className="text-2xl mb-2">💬</span>
                      <p className="text-xs text-gray-700 text-center line-clamp-4 italic leading-relaxed">
                        {postText}
                      </p>
                    </div>
                  )}

                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={resolveImageUrl(author.profileImage)} />
                        <AvatarFallback className="text-[10px]">
                          {author.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-xs truncate">{author.name || 'User'}</p>
                    </div>
                    {postText && !isTextOnly && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{postText}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Heart className="h-2.5 w-2.5" /> {post.likeCount || post.reactions?.length || post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MessageCircle className="h-2.5 w-2.5" /> {post.commentCount || post.comments?.length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('explore.weekTitle', { defaultValue: 'Diese Woche in Wien' })}
        </h1>
        {!isLoading && (
          <p className="text-muted-foreground mt-1">
            {feedStats.total} Events · {feedStats.free} {t('explore.freeEvents', { defaultValue: 'Gratis-Eintritte' })}
          </p>
        )}
      </div>

      {/* Location Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card rounded-xl border">
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

      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 space-y-2 border-b">
        {/* Date Filter Chips */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('explore.dateLabel', { defaultValue: 'Wann' })}
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { value: 'today', label: t('explore.dateToday', { defaultValue: 'Heute' }) },
              { value: 'tomorrow', label: t('explore.dateTomorrow', { defaultValue: 'Morgen' }) },
              { value: 'weekend', label: t('explore.dateWeekend', { defaultValue: 'Wochenende' }) },
              { value: 'this_week', label: t('explore.dateThisWeek', { defaultValue: 'Diese Woche' }) },
              { value: 'next_week', label: t('explore.dateNextWeek', { defaultValue: 'Nächste Woche' }) },
            ].map((d) => (
              <button
                key={d.value}
                onClick={() => setDateFilter(dateFilter === d.value ? 'all' : d.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  dateFilter === d.value
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                dateFilter === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {customDate && dateFilter === 'custom'
                ? new Date(customDate).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' })
                : t('explore.dateChoose', { defaultValue: 'Datum wählen' })}
            </button>
          </div>
          {showDatePicker && (
            <div className="pt-1">
              <input
                type="date"
                className="px-3 py-1.5 border rounded-lg text-sm bg-background"
                value={customDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setCustomDate(e.target.value)
                  setDateFilter('custom')
                  setShowDatePicker(false)
                }}
              />
            </div>
          )}
        </div>

        <div className="border-t" />

        {/* Category + Price Filter Chips */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('explore.categoryLabel', { defaultValue: 'Was' })}
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              priceFilter === 'free' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {t('explore.priceFree', { defaultValue: 'Gratis' })}
          </button>
          {(() => {
            const workshopCat = EVENT_CATEGORIES.find(c => c.value === 'Workshop')
            if (!workshopCat) return null
            return (
              <button
                key="Workshop"
                onClick={() => setSelectedCategory(selectedCategory === 'Workshop' ? 'all' : 'Workshop')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === 'Workshop'
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {t('categories.Workshop', { defaultValue: workshopCat.label })}
              </button>
            )
          })()}
          {(() => {
            const priorityOrder = ['Music', 'Clubbing', 'Business']
            const cats = EVENT_CATEGORIES.filter(c => c.value !== 'Other' && c.value !== 'Workshop')
            const sorted = [
              ...cats.filter(c => priorityOrder.includes(c.value))
                .sort((a, b) => priorityOrder.indexOf(a.value) - priorityOrder.indexOf(b.value)),
              ...cats.filter(c => !priorityOrder.includes(c.value)),
            ]
            return sorted
          })().flatMap((cat) => {
            const categoryButton = (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? 'all' : cat.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {t(`categories.${cat.value}`, { defaultValue: cat.label })}
              </button>
            )
            if (cat.value === 'Clubbing') {
              return [
                categoryButton,
                <button
                  key="raffle-filter"
                  onClick={() => setPriceFilter(priceFilter === 'raffle' ? 'all' : 'raffle')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    priceFilter === 'raffle' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  🎰 {t('explore.raffles', { defaultValue: 'Gewinnspiele' })}
                </button>,
              ]
            }
            if (cat.value !== 'Sports') return [categoryButton]
            return [
              categoryButton,
              <button
                key="online-filter"
                onClick={() => setPriceFilter(priceFilter === 'online' ? 'all' : 'online')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  priceFilter === 'online' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {t('explore.online', { defaultValue: 'Online' })}
              </button>,
            ]
          })}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 whitespace-nowrap"
            >
              ✕ {t('common.clear', { defaultValue: 'Löschen' })}
            </button>
          )}
          </div>
        </div>

      </div>

      {/* Loading */}
      {(!locationLoaded || isLoading || (showTicketmaster && loadingTicketmaster)) ? (
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="space-y-10">
          {/* Veranstalter-Hinweis bei Suche */}
          {submittedSearch && events && (events as any[]).length > 0 && (() => {
            const organizerIds = [...new Set((events as any[]).map((e: any) => e.userId))]
            if (organizerIds.length === 1) {
              const organizerId = organizerIds[0]
              return (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <span>{t('explore.organizerHint', { defaultValue: 'Alle Ergebnisse sind von einem Veranstalter.' })}</span>
                  <Link href={`/user/${organizerId}`} className="text-primary font-medium hover:underline">
                    {t('explore.viewProfile', { defaultValue: 'Profil ansehen' })}
                  </Link>
                </div>
              )
            }
            return null
          })()}

          {!isFilterActive && (
            <>
              {/* 🔥 Top Pick */}
              {topPicks.length > 0 && (
                <EventSection
                  title={`🔥 ${t('explore.topPick', { defaultValue: 'Top Pick' })}`}
                  events={topPicks}
                />
              )}

              {/* ⚡ Gesponserte Events — bezahlte Platzierung.
                  Steht bewusst NACH Top Pick: Bezahltes vor der redaktionellen
                  Empfehlung würde beide entwerten. Volle Überschriftengröße wie
                  alle anderen Sektionen — eine kleiner gesetzte Kennzeichnung
                  sähe aus, als wolle man sie verstecken.
                  EventSection rendert nichts, wenn die Liste leer ist, und begrenzt
                  auf drei Karten. Das „Gesponsert"-Badge sitzt auf der EventCard
                  selbst und erscheint hier deshalb automatisch. */}
              <EventSection
                title={`⚡ ${t('explore.boostedEvents', { defaultValue: 'Gesponserte Events' })}`}
                events={boostedEvents}
              />

              {/* Posts Row 1 — nach Top Picks */}
              {topPicks.length > 0 && latestPosts.length > 0 && (
                <PostRow posts={latestPosts.slice(0, 3)} />
              )}

              {/* Communities entdecken */}
              {topCommunities && topCommunities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">
                      🏘 {t('explore.discoverCommunities', { defaultValue: 'Communities entdecken' })}
                    </h2>
                    <Link
                      href="/feed?tab=communities"
                      className="text-sm text-primary hover:underline"
                    >
                      {t('explore.showAll', { defaultValue: 'Alle anzeigen' })} →
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('explore.communitiesSubline', { defaultValue: 'Finde Gleichgesinnte und verpasse kein Event mehr.' })}
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                    {topCommunities.map((community: any) => (
                      <div key={community._id} className="flex-shrink-0 w-[70vw] md:w-auto">
                        <CommunityCard community={community} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🎰 Gewinnspiele */}
              {raffleEvents && raffleEvents.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight">
                    🎰 {t('explore.raffles', { defaultValue: 'Gewinnspiele' })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('explore.rafflesSubline', { defaultValue: 'Nimm kostenlos teil und gewinne tolle Preise.' })}
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                    {raffleEvents.slice(0, 3).map((event: any) => (
                      <div key={event._id} className="flex-shrink-0 w-[70vw] md:w-auto">
                        <RaffleEventCard event={event} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🎟 Abendkasse */}
              <EventSection
                title={`🎟 ${t('explore.doorEvents', { defaultValue: 'Mit Gästeliste (Abendkasse)' })}`}
                events={doorEvents}
                onShowAll={() => scrollToAllEvents({ priceFilter: 'door' })}
              />

              {/* Posts Row 2 — nach Abendkasse */}
              {doorEvents.length > 0 && latestPosts.length > 3 && (
                <PostRow posts={latestPosts.slice(3, 6)} />
              )}

              {/* 🎉 Kostenlos starten */}
              <EventSection
                title={`🎉 ${t('explore.freeToStart', { defaultValue: 'Kostenlos starten' })}`}
                events={freeEvents}
                onShowAll={() => scrollToAllEvents({ priceFilter: 'free' })}
              />

              {/* Posts Row 3 — nach Kostenlos */}
              {freeEvents.length > 0 && latestPosts.length > 6 && (
                <PostRow posts={latestPosts.slice(6, 9)} />
              )}

              {/* 💻 Online Events */}
              <EventSection
                title={`💻 ${t('explore.onlineEvents', { defaultValue: 'Online Events' })}`}
                events={onlineEvents}
                onShowAll={() => scrollToAllEvents({ priceFilter: 'online' })}
              />

              {/* 📸 Memories der Woche */}
              {recentMemories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">
                      📸 {t('explore.memoriesOfWeek', { defaultValue: 'Memories der Woche' })}
                    </h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                    {recentMemories.slice(0, 3).map((memory: any) => (
                      <div
                        key={memory.memoryId}
                        className="flex-shrink-0 w-[60vw] md:w-auto"
                      >
                        <div
                          className="relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group"
                          onClick={() => {
                            if (memory.event?.slug || memory.event?._id) {
                              const eventPath = memory.event?.slug || memory.event?._id || ''
                              router.push(`/event/${eventPath.replace(/#.*$/, '')}#memories`)
                            } else {
                              setFullscreenMemory(resolveImageUrl(memory.url) || null)
                            }
                          }}
                        >
                          {memory.type === 'video' ? (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-4xl">▶️</span>
                            </div>
                          ) : (
                            <img
                              src={resolveImageUrl(memory.url)}
                              alt={memory.caption || 'Memory'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          )}

                          {/* Event name overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={resolveImageUrl(memory.uploadedBy?.profileImage)} />
                                <AvatarFallback className="text-[8px]">
                                  {memory.uploadedBy?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white text-xs truncate">
                                {memory.uploadedBy?.name || 'User'}
                              </span>
                            </div>
                            {memory.event?.name && (
                              <p className="text-white text-xs font-medium truncate">
                                🎉 {memory.event.name}
                              </p>
                            )}
                          </div>

                          {/* Reactions count */}
                          {memory.reactions?.length > 0 && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full px-2 py-0.5 text-xs">
                              ❤️ {memory.reactions.length}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kategorie-Sektionen */}
              {categoriesWithEvents.map(([category, evs]) => {
                const catInfo = EVENT_CATEGORIES.find((c) => c.value === category)
                const catLabel = catInfo?.label || category
                return (
                  <EventSection
                    key={category}
                    title={catLabel}
                    events={evs}
                    onShowAll={() => scrollToAllEvents({ selectedCategory: category })}
                  />
                )
              })}
            </>
          )}

          {/* 📋 Alle Events */}
          {(() => {
            const eventsToShow = isFilterActive
              ? (filteredEvents || [])
              : (filteredEvents || []).filter((e: any) => !e.isTicketmaster && !e.isExternalEvent)

            return eventsToShow.length > 0 ? (
              <div ref={allEventsRef} className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight">
                  📋 {t('explore.allEvents', { defaultValue: 'Alle Events' })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventsToShow.map((event: any) => (
                    <EventCard
                      key={event._id || event.id}
                      event={event}
                      attendees={attendeePreviews?.[(event._id || event.id) as string] || []}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div ref={allEventsRef} />
            )
          })()}

          {/* Feed CTA */}
          <div className="text-center py-4">
            <Link href="/feed">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('explore.goToFeed', { defaultValue: 'Mehr aus der Community' })}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {submittedSearch
              ? t('explore.noSearchResults', { defaultValue: 'Keine Ergebnisse' })
              : t('explore.noEvents', { defaultValue: 'Keine Events gefunden' })}
          </h3>
          <p className="text-muted-foreground">
            {submittedSearch
              ? t('explore.tryOtherSearch', { defaultValue: 'Versuche einen anderen Suchbegriff.' })
              : t('explore.noEventsDesc', { defaultValue: 'Aktuell keine Events in deiner Nähe.' })}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t('common.resetFilters', { defaultValue: 'Filter zurücksetzen' })}
            </Button>
          )}
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelect={handleLocationSelect}
        initialLocation={selectedLocation}
      />

      {/* Fullscreen Memory */}
      {fullscreenMemory && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreenMemory(null)}
        >
          <img
            src={fullscreenMemory}
            alt="Memory"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl"
            onClick={() => setFullscreenMemory(null)}
          >
            ✕
          </button>
        </div>
      )}

      <ScrollSignupPrompt />

      {/* Gewinnspiel-Promo — nur auf Explore und Feed, nicht global im Layout */}
      <RafflePromoBanner />
    </div>
  )
}

export default function Explore() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  )
}
