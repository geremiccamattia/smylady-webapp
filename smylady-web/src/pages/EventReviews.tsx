import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Star, MessageSquare, User } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { reviewsService, type Review, type ReviewSummary } from '@/services/reviews'
import { resolveImageUrl } from '@/lib/utils'

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-${size / 4} w-${size / 4}`}
          style={{ width: size, height: size }}
          fill={star <= rating ? '#FFD700' : 'transparent'}
          color={star <= rating ? '#FFD700' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

export default function EventReviews() {
  const { t } = useTranslation()
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const eventName = searchParams.get('name') || ''

  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!eventId) return
    loadData()
  }, [eventId])

  const loadData = async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const [summaryResponse, reviewsResponse] = await Promise.all([
        reviewsService.getEventRatingSummary(eventId),
        reviewsService.getEventReviews(eventId, 1, 20),
      ])

      setSummary(summaryResponse || null)
      setReviews(reviewsResponse?.reviews || [])
      setHasMore(
        (reviewsResponse?.pagination?.page || 1) <
          (reviewsResponse?.pagination?.totalPages || 1)
      )
      setPage(1)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loading || !eventId) return

    try {
      const nextPage = page + 1
      const response = await reviewsService.getEventReviews(eventId, nextPage, 20)
      const newReviews = response?.reviews || []

      setReviews((prev) => [...prev, ...newReviews])
      setPage(nextPage)
      setHasMore(nextPage < (response?.pagination?.totalPages || 1))
    } catch (error) {
      console.error('Error loading more reviews:', error)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to={eventId ? `/event/${eventId}` : '/'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Star className="h-6 w-6 text-yellow-400" />
          <h1 className="text-xl font-semibold">
            {t('reviews.eventReviews', { defaultValue: 'Bewertungen' })}
          </h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={eventId ? `/event/${eventId}` : '/'}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Star className="h-6 w-6 text-yellow-400" />
        <h1 className="text-xl font-semibold">
          {t('reviews.eventReviews', { defaultValue: 'Bewertungen' })}
        </h1>
      </div>

      {/* Summary Card */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        {eventName && (
          <h2 className="text-lg font-semibold mb-4 line-clamp-2">{eventName}</h2>
        )}

        {/* Average Rating */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-4xl font-bold">
            {(summary?.averageRating || 0).toFixed(1)}
          </span>
          <div>
            <StarRating rating={summary?.averageRating || 0} size={28} />
            <p className="text-sm text-muted-foreground mt-1">
              {summary?.totalReviews === 1
                ? t('reviews.oneReview', { defaultValue: '1 Bewertung' })
                : t('reviews.totalReviews', {
                    defaultValue: '{{count}} Bewertungen',
                    count: summary?.totalReviews || 0,
                  })}
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        {summary && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution?.[star as keyof typeof summary.distribution] || 0
              const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0

              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-3 text-sm">{star}</span>
                  <Star className="h-4 w-4 text-yellow-400" fill="#FFD700" />
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="w-8 text-sm text-muted-foreground text-right">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reviews List */}
      <h3 className="font-semibold mb-4">
        {t('reviews.allReviews', { defaultValue: 'Alle Bewertungen' })}
      </h3>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('reviews.noReviews')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const user = typeof review.userId === 'object' ? review.userId : null
            const userName = user?.name || user?.username || 'Anonym'
            const userImage = user?.profileImage

            return (
              <div key={review._id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={resolveImageUrl(userImage)} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && review.comment.trim() !== '' && (
                  <p className="text-sm">{review.comment}</p>
                )}
              </div>
            )
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={loadMore}>
                {t('common.loadMore', { defaultValue: 'Mehr laden' })}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
