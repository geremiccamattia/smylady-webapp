'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { eventsService } from '@/services/events'
import { userService } from '@/services/user'
import { publicClient } from '@/services/api'
import { ticketmasterService } from '@/services/ticketmaster'
import {
  isTicketmasterEnabled,
  setTicketmasterEnabled,
  getManualLocation,
  getCurrentLocation,
  isLiveLocationEnabled,
} from '@/services/location'
import Link from 'next/link'
import ScrollSignupPrompt from '@/components/ScrollSignupPrompt'
import EventCard from '@/components/events/EventCard'
import LocationModal, { LocationResult } from '@/components/LocationModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
  Ticket,
  MapPin,
  Navigation,
  ChevronRight,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { resolveImageUrl } from '@/lib/utils'
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
  const [showTicketmaster, setShowTicketmaster] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('syp_ticketmaster_enabled')
    return saved === null ? true : saved === 'true'
  })

  // Location state
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [radius, setRadius] = useState('25')
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
      dateFilter,
      selectedLocation?.lat,
      selectedLocation?.lng,
      radius,
    ],
    queryFn: () => {
      console.log('QUERY FIRED with search:', searchRef.current)
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

  // Combine events
  const allEvents: Event[] = [
    ...(events || []),
    ...(showTicketmaster && ticketmasterEvents
      ? ticketmasterEvents.map((e: Event) => ({ ...e, isTicketmaster: true }))
      : []),
  ]

  const filteredEvents = useMemo(() => {
    const topPickIds = new Set(topPicks.map((e: any) => e._id))
    let result: Event[] = (allEvents || []).filter((e: any) => !topPickIds.has(e._id))

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
          const day = now.getDay()
          let saturday: Date, sunday: Date
          if (day === 0) {
            saturday = new Date(now); saturday.setDate(now.getDate() - 1)
            sunday = new Date(now)
          } else if (day === 6) {
            saturday = new Date(now)
            sunday = new Date(now); sunday.setDate(now.getDate() + 1)
          } else {
            saturday = new Date(now); saturday.setDate(now.getDate() + (6 - day))
            sunday = new Date(saturday); sunday.setDate(saturday.getDate() + 1)
          }
          from = startOfDay(saturday); to = endOfDay(sunday); break
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
        if (e.isTicketmaster || e.isExternalEvent) return true
        switch (priceFilter) {
          case 'free': return (e.price === 0 || !e.price) && e.paymentType !== 'door'
          case 'paid': return e.price > 0 && e.paymentType !== 'door'
          case 'door': return e.paymentType === 'door'
          default: return true
        }
      })
    }

    return result
  }, [allEvents, dateFilter, priceFilter])

  // === SECTION-BASED FEED ===

  const feedStats = useMemo(() => {
    const upcoming = filteredEvents || []
    const freeCount = upcoming.filter((e: any) =>
      !e.isTicketmaster && !e.isExternalEvent && (e.price === 0 || !e.price) && e.paymentType !== 'door'
    ).length
    const withAttendees = upcoming.filter((e: any) => (e.soldTickets || 0) > 0).length
    return { total: upcoming.length, free: freeCount, withAttendees }
  }, [filteredEvents])

  const doorEvents = useMemo(() => {
    const topPickIds = new Set(topPicks.map((e: any) => e._id))
    return (filteredEvents || [])
      .filter((e: any) => {
        const eid = e._id || e.id
        return !e.isTicketmaster && !topPickIds.has(eid) && e.paymentType === 'door'
      })
      .sort((a: any, b: any) =>
        new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
      )
      .slice(0, 3)
  }, [filteredEvents, topPicks])

  const freeEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
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
  }, [filteredEvents, topPicks, doorEvents])

  const categoriesWithEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...doorEvents.map((e: any) => e._id || e.id),
      ...freeEvents.map((e: any) => e._id || e.id),
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
  }, [filteredEvents, topPicks, doorEvents, freeEvents])

  const remainingEvents = useMemo(() => {
    const usedIds = new Set([
      ...topPicks.map((e: any) => e._id),
      ...doorEvents.map((e: any) => e._id || e.id),
      ...freeEvents.map((e: any) => e._id || e.id),
      ...categoriesWithEvents.flatMap(([_, evs]) => evs.map((e: any) => e._id || e.id)),
    ])
    return (filteredEvents || [])
      .filter((e: any) => !usedIds.has(e._id || e.id))
      .sort((a: any, b: any) =>
        new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime()
      )
  }, [filteredEvents, topPicks, doorEvents, freeEvents, categoriesWithEvents])

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
    console.log('HANDLE SEARCH - searchQuery:', searchQuery)
    console.log('HANDLE SEARCH - searchRef:', searchRef.current)
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

  const handleTicketmasterToggle = (enabled: boolean) => {
    setShowTicketmaster(enabled)
    setTicketmasterEnabled(enabled)
  }

  const hasActiveFilters = submittedSearch ||
    (selectedCategory && selectedCategory !== 'all') ||
    (dateFilter && dateFilter !== 'all') ||
    (priceFilter && priceFilter !== 'all')

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
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">
          💭 {t('explore.yourVibes', { defaultValue: 'Deine Vibes' })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.slice(0, 3).map((post: any) => {
            const author = post.userId || post.user || {}
            const firstImage = post.media?.find((m: any) => m.type === 'image')
            const firstVideo = post.media?.find((m: any) => m.type === 'video')
            const postImage = firstImage?.url || post.images?.[0]?.url || post.images?.[0]
            const postText = post.text || post.content || ''
            const postId = post._id || post.id
            return (
              <Link key={postId} href={`/feed#post-${postId}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  {(postImage || firstVideo) && (
                    <div className="aspect-video relative overflow-hidden">
                      {postImage ? (
                        <img
                          src={resolveImageUrl(postImage)}
                          alt=""
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-3xl">▶️</span>
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={resolveImageUrl(author.profileImage)} />
                        <AvatarFallback className="text-xs">
                          {author.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{author.name || 'User'}</p>
                        {postText && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{postText}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" /> {post.likeCount || post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageCircle className="h-3 w-3" /> {post.commentCount || post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
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
    <div className="space-y-8">
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
          </div>
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
          {EVENT_CATEGORIES.filter(c => c.value !== 'Other').map((cat) => (
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
          ))}
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

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('explore.searchPlaceholder', { defaultValue: 'Events suchen...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e) }}
            className="pl-10 h-9"
          />
        </form>
      </div>

      {/* Ticketmaster Toggle */}
      <div className="flex items-center justify-between p-3 bg-card rounded-xl border">
        <div className="flex items-center gap-3">
          <Ticket className={`h-5 w-5 ${showTicketmaster ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="font-medium text-sm">
            {t('explore.ticketmasterEvents', { defaultValue: 'Ticketmaster Events' })}
          </span>
        </div>
        <Switch checked={showTicketmaster} onCheckedChange={handleTicketmasterToggle} />
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

          {/* 🔥 Top Pick */}
          {topPicks.length > 0 && (
            <EventSection
              title={`🔥 ${t('explore.topPick', { defaultValue: 'Top Pick' })}`}
              events={topPicks}
            />
          )}

          {/* Posts Row 1 — nach Top Picks */}
          {topPicks.length > 0 && latestPosts.length > 0 && (
            <PostRow posts={latestPosts.slice(0, 3)} />
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

          {/* 📋 Alle Events */}
          {(() => {
            const isFilterActive = (priceFilter && priceFilter !== 'all') ||
              (dateFilter && dateFilter !== 'all') ||
              (selectedCategory && selectedCategory !== 'all')
            const eventsToShow = isFilterActive
              ? (filteredEvents || [])
              : remainingEvents.filter((e: any) => !e.isTicketmaster && !e.isExternalEvent)

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

      <ScrollSignupPrompt />
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
