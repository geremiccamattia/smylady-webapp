import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Star, ChevronRight, Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { userService } from '@/services/user'
import { reviewsService } from '@/services/reviews'
import { resolveImageUrl } from '@/lib/utils'
import type { Event } from '@/types'

interface EventWithRating extends Event {
  averageRating?: number
  totalReviews?: number
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          fill={star <= rating ? '#FFD700' : 'transparent'}
          color={star <= rating ? '#FFD700' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

export default function OrganizerReviews() {
  const { t } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userName = searchParams.get('name') || ''

  const [eventsWithRatings, setEventsWithRatings] = useState<EventWithRating[]>([])
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [totalReviewCount, setTotalReviewCount] = useState(0)

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => userService.getUserProfile(userId!),
    enabled: !!userId,
  })

  const pastEvents = userProfile?.pastEvents || []

  useEffect(() => {
    if (pastEvents.length > 0) {
      loadRatingsForEvents()
    } else {
      setLoadingRatings(false)
    }
  }, [pastEvents])

  const loadRatingsForEvents = async () => {
    setLoadingRatings(true)
    try {
      const validEvents = pastEvents.filter(
        (event: Event) => event && typeof event !== 'string'
      )

      const ratingPromises = validEvents.map(async (event: Event) => {
        try {
          const eventId = event._id || event.id
          if (!eventId) return null
          const summary = await reviewsService.getEventRatingSummary(eventId)

          if (summary && summary.totalReviews > 0) {
            return {
              ...event,
              _id: eventId,
              name: event.name || (event as any).title || 'Unnamed Event',
              locationImages: event.locationImages || [],
              eventDate: event.eventDate,
              averageRating: summary.averageRating,
              totalReviews: summary.totalReviews,
            } as EventWithRating
          }
          return null
        } catch {
          return null
        }
      })

      const results = await Promise.all(ratingPromises)
      const eventsWithRatingData: EventWithRating[] = results.filter(
        (event): event is EventWithRating => event !== null
      )

      const totalReviews = eventsWithRatingData.reduce(
        (sum, event) => sum + (event.totalReviews || 0),
        0
      )

      // Sort by number of reviews (most reviewed first)
      eventsWithRatingData.sort(
        (a, b) => (b.totalReviews || 0) - (a.totalReviews || 0)
      )

      setEventsWithRatings(eventsWithRatingData)
      setTotalReviewCount(totalReviews)
    } catch (error) {
      console.error('Error loading ratings:', error)
    } finally {
      setLoadingRatings(false)
    }
  }

  const handleEventPress = (event: EventWithRating) => {
    navigate(`/event/${event._id}/reviews?name=${encodeURIComponent(event.name || '')}`)
  }

  const isLoading = profileLoading || loadingRatings
  const displayName = userProfile?.name || userName

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to={userId ? `/user/${userId}` : '/'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Star className="h-6 w-6 text-yellow-400" />
          <h1 className="text-xl font-semibold">
            {t('reviews.reviewsTitle', { defaultValue: 'Bewertungen' })}
          </h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={userId ? `/user/${userId}` : '/'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Star className="h-6 w-6 text-yellow-400" />
          <h1 className="text-xl font-semibold">
            {displayName
              ? t('reviews.organizerReviewsTitle', {
                  defaultValue: '{{name}}s Bewertungen',
                  name: displayName,
                })
              : t('reviews.reviewsTitle', { defaultValue: 'Bewertungen' })}
          </h1>
        </div>
        {totalReviewCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            {t('reviews.totalReviewsBadge', {
              defaultValue: '{{count}} gesamt',
              count: totalReviewCount,
            })}
          </span>
        )}
      </div>

      {/* Events List */}
      {eventsWithRatings.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {t('reviews.noReviews')}
          </h2>
          <p className="text-muted-foreground">
            {t('reviews.organizerNoReviews')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {eventsWithRatings.map((event) => {
            const imageUrl = event.locationImages?.[0]?.url

            return (
              <button
                key={event._id}
                className="w-full bg-card border rounded-lg p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors text-left"
                onClick={() => handleEventPress(event)}
              >
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {imageUrl ? (
                    <img
                      src={resolveImageUrl(imageUrl)}
                      alt={event.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2">{event.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={event.averageRating || 0} size={16} />
                    <span className="text-sm font-medium">
                      {(event.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.totalReviews === 1
                      ? t('reviews.oneReview', { defaultValue: '1 Bewertung' })
                      : t('reviews.totalReviews', {
                          defaultValue: '{{count}} Bewertungen',
                          count: event.totalReviews,
                        })}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
