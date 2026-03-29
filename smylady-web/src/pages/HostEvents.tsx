import { useState, useMemo } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, Search, ChevronLeft, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import EventCard from '@/components/events/EventCard'
import { organizerSubscriptionService } from '@/services/organizerSubscription'
import { userService } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getInitials, resolveImageUrl } from '@/lib/utils'
import type { Event } from '@/types'

export default function HostEvents() {
  const { t } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const hostName = searchParams.get('name') || ''
  const hostImage = searchParams.get('image') || ''
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const isSelf = currentUser?._id === userId || currentUser?.id === userId

  // Fetch host profile (which includes upcomingEvents and pastEvents)
  const { data: hostProfile, isLoading: eventsLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => userService.getUserProfile(userId!),
    enabled: !!userId,
  })

  // Check subscription status (must be before events memo)
  const { data: isSubscribed = false } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => organizerSubscriptionService.getSubscriptionStatus(userId!),
    enabled: !!userId && !!currentUser && !isSelf,
  })

  // Get events from the user profile - filter out subscriber-only/selected events
  // that the current user should not see (defense-in-depth, backend already filters)
  const events = useMemo(() => {
    const profileEvents: Event[] = []
    const allProfileEvents = [
      ...(hostProfile?.upcomingEvents || []),
      ...(hostProfile?.pastEvents || []),
    ].filter((e: any) => e && (e._id || e.id))

    allProfileEvents.forEach((event: any) => {
      // Ensure _id is a string (MongoDB ObjectId might be an object)
      profileEvents.push({
        ...event,
        _id: event._id?.toString?.() || event._id || event.id,
        id: event.id || event._id?.toString?.() || event._id,
      })
    })

    // Client-side visibility filter: only show public events to non-subscribers
    // The owner always sees all their events
    if (isSelf) return profileEvents

    return profileEvents.filter((event) => {
      const visibility = event.visibility || 'public'
      // Public events are always visible
      if (visibility === 'public') return true
      // Subscriber-only events: only if current user is subscribed
      if (visibility === 'subscribers') return isSubscribed
      // Selected events: the backend should already filter these, but as safety check
      if (visibility === 'selected') return false
      return true
    })
  }, [hostProfile, isSelf, isSubscribed])

  // Toggle subscription mutation
  const toggleSubscriptionMutation = useMutation({
    mutationFn: () => organizerSubscriptionService.toggleSubscription(userId!),
    onSuccess: (subscribed) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] })
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
      toast({
        description: subscribed
          ? t('hostEvents.subscribeSuccessToast', { host: displayName })
          : t('hostEvents.unsubscribeSuccessToast', { host: displayName }),
      })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('hostEvents.subscriptionError'),
      })
    },
  })

  // Split events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date()
    const upcoming: Event[] = []
    const past: Event[] = []

    events.forEach((event: Event) => {
      const eventTime = new Date(event.eventStartTime || event.eventDate)
      if (eventTime >= now) {
        upcoming.push(event)
      } else {
        past.push(event)
      }
    })

    // Sort upcoming: nearest first
    upcoming.sort(
      (a, b) =>
        new Date(a.eventStartTime || a.eventDate).getTime() -
        new Date(b.eventStartTime || b.eventDate).getTime()
    )

    // Sort past: most recent first
    past.sort(
      (a, b) =>
        new Date(b.eventStartTime || b.eventDate).getTime() -
        new Date(a.eventStartTime || a.eventDate).getTime()
    )

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [events])

  // Filter events by search query
  const filteredEvents = useMemo(() => {
    const sourceEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

    if (!searchQuery.trim()) {
      return sourceEvents
    }

    const query = searchQuery.toLowerCase()
    return sourceEvents.filter(
      (event) =>
        event.name?.toLowerCase().includes(query) ||
        (event as any).title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.locationName?.toLowerCase().includes(query)
    )
  }, [upcomingEvents, pastEvents, activeTab, searchQuery])

  const displayName = hostProfile?.name || hostName || t('common.user')
  const displayImage = resolveImageUrl(hostProfile?.profileImage || hostImage)

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={userId ? `/user/${userId}` : '/'}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold truncate">
          {t('hostEvents.title', { host: displayName })}
        </h1>
      </div>

      {/* Host Card */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <Link to={`/user/${userId}`} className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={displayImage} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('event.createdBy', { defaultValue: 'Hoster' })}
              </p>
              <p className="font-semibold">{displayName}</p>
            </div>
          </Link>

          {!isSelf && currentUser && (
            <Button
              variant={isSubscribed ? 'default' : 'outline'}
              size="icon"
              onClick={() => toggleSubscriptionMutation.mutate()}
              disabled={toggleSubscriptionMutation.isPending}
            >
              {isSubscribed ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="upcoming">
            {t('hostEvents.upcoming', { defaultValue: 'Upcoming' })} ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            {t('hostEvents.past', { defaultValue: 'Past' })} ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('hostEvents.searchPlaceholder', { defaultValue: 'Search events...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <TabsContent value="upcoming">
          {eventsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('hostEvents.emptyUpcoming', { defaultValue: 'No upcoming events found.' })}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {eventsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('hostEvents.emptyPast', { defaultValue: 'No past events found.' })}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
