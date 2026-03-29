import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { reviewsService, Review } from '@/services/reviews'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import {
  Star,
  Edit,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface EventReviewsProps {
  eventId: string
  eventEnded?: boolean
}

// Star Rating Component
function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
}: {
  rating: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer'
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}

// Rating Distribution Bar
function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3">{stars}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-muted-foreground">{count}</span>
    </div>
  )
}

export function EventReviews({ eventId, eventEnded = false }: EventReviewsProps) {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAll, setShowAll] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['eventReviews', eventId],
    queryFn: () => reviewsService.getEventReviews(eventId),
  })

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['eventReviewSummary', eventId],
    queryFn: () => reviewsService.getEventSummary(eventId),
  })

  // Fetch user's review
  const { data: myReview } = useQuery({
    queryKey: ['myEventReview', eventId],
    queryFn: () => reviewsService.getMyReview(eventId),
    enabled: isAuthenticated,
  })

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: () =>
      reviewsService.create({
        eventId,
        rating: newRating,
        comment: newComment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReviews', eventId] })
      queryClient.invalidateQueries({ queryKey: ['myEventReview', eventId] })
      queryClient.invalidateQueries({ queryKey: ['eventReviewSummary', eventId] })
      toast({ title: t('reviews.submitted') })
      setNewRating(0)
      setNewComment('')
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('reviews.saveError'),
      })
    },
  })

  // Update review mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      reviewsService.update(myReview!._id, {
        rating: newRating,
        comment: newComment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReviews', eventId] })
      queryClient.invalidateQueries({ queryKey: ['myEventReview', eventId] })
      queryClient.invalidateQueries({ queryKey: ['eventReviewSummary', eventId] })
      toast({ title: t('reviews.updated') })
      setIsEditing(false)
    },
  })

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: () => reviewsService.delete(myReview!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventReviews', eventId] })
      queryClient.invalidateQueries({ queryKey: ['myEventReview', eventId] })
      queryClient.invalidateQueries({ queryKey: ['eventReviewSummary', eventId] })
      toast({ title: t('reviews.deleted') })
    },
  })

  const reviews = reviewsData?.reviews || []
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3)
  const canReview = isAuthenticated && eventEnded && !myReview

  const handleSubmitReview = () => {
    if (newRating === 0) {
      toast({
        variant: 'destructive',
        title: t('reviews.required'),
        description: t('reviews.pleaseSelectRating'),
      })
      return
    }

    if (isEditing) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const handleEditStart = () => {
    if (myReview) {
      setNewRating(myReview.rating)
      setNewComment(myReview.comment)
      setIsEditing(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {t('reviews.title')}
          {summary && (
            <span className="text-muted-foreground font-normal text-base ml-2">
              ({summary.totalReviews})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        {summary && summary.totalReviews > 0 && (
          <div className="flex gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold">{summary.averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(summary.averageRating)} readonly size="sm" />
              <p className="text-sm text-muted-foreground mt-1">
                {t('reviews.reviewCount', { count: summary.totalReviews })}
              </p>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((stars) => (
                <RatingBar
                  key={stars}
                  stars={stars}
                  count={summary.distribution?.[stars as keyof typeof summary.distribution] || 0}
                  total={summary.totalReviews}
                />
              ))}
            </div>
          </div>
        )}

        {/* My Review */}
        {myReview && !isEditing && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{t('reviews.yourReview')}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleEditStart}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
            <StarRating rating={myReview.rating} readonly />
            {myReview.comment && (
              <p className="text-sm mt-2">{myReview.comment}</p>
            )}
          </div>
        )}

        {/* Write Review Form */}
        {(canReview || isEditing) && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium mb-2">
                {isEditing ? t('reviews.edit') : t('reviews.rateEvent')}
              </p>
              <StarRating
                rating={newRating}
                onChange={setNewRating}
                size="lg"
              />
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('reviews.shareExperience')}
              className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background resize-y"
            />
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setNewRating(0)
                    setNewComment('')
                  }}
                >
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                onClick={handleSubmitReview}
                disabled={newRating === 0 || createMutation.isPending || updateMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isEditing ? t('reviews.update') : t('reviews.submit')}
              </Button>
            </div>
          </div>
        )}

        {/* Cannot Review Message */}
        {isAuthenticated && !eventEnded && !myReview && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('reviews.canReviewAfterEvent')}
          </p>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {t('reviews.noReviews')}
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>

            {reviews.length > 3 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    {t('reviews.showLess')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {t('reviews.showAll', { count: reviews.length })}
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Individual Review Card
function ReviewCard({ review }: { review: Review }) {
  const reviewUser = review.userId || {} as any
  const reviewUserId = reviewUser?._id || (reviewUser as any)?.id || ''

  return (
    <div className="pb-4 border-b last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <Link to={`/user/${reviewUserId}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={resolveImageUrl(reviewUser?.profileImage)} />
            <AvatarFallback>{getInitials(reviewUser?.name || '')}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link
            to={`/user/${reviewUserId}`}
            className="font-medium hover:underline"
          >
            {reviewUser?.name || 'User'}
          </Link>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} readonly size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), {
                addSuffix: true,
                locale: de,
              })}
            </span>
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      )}
    </div>
  )
}



export default EventReviews
