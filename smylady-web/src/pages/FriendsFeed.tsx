import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Calendar,
  MessageSquare,
  MapPin,
  Clock,
  User,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { StoriesBar } from '@/components/stories/StoriesBar'
import { postsService } from '@/services/posts'
import { userService } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, resolveImageUrl } from '@/lib/utils'

interface FriendsEvent {
  event: {
    _id: string
    name: string
    locationName: string
    locationImages?: Array<{ url: string }>
    eventStartTime: string
    organizer?: { name: string }
  }
  attendees: Array<{
    _id: string
    name: string
    profileImage?: string
  }>
}

export default function FriendsFeed() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'posts' | 'events'>('posts')

  // Friends posts feed
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    fetchNextPage: fetchNextPosts,
    hasNextPage: hasNextPosts,
    isFetchingNextPage: isFetchingNextPosts,
  } = useInfiniteQuery({
    queryKey: ['friendsFeed'],
    queryFn: ({ pageParam = 1 }) => postsService.getFriendsFeed(pageParam, 10),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.posts.length < 10) return undefined
      return pages.length + 1
    },
    initialPageParam: 1,
  })

  // Friends events feed
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    fetchNextPage: fetchNextEvents,
    hasNextPage: hasNextEvents,
    isFetchingNextPage: isFetchingNextEvents,
  } = useInfiniteQuery({
    queryKey: ['friendsEvents'],
    queryFn: ({ pageParam = 1 }) => userService.getFriendsEvents(pageParam, 10),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage?.events || lastPage.events.length < 10) return undefined
      return pages.length + 1
    },
    initialPageParam: 1,
    enabled: activeTab === 'events',
  })

  const posts = postsData?.pages.flatMap((page) => page.posts) || []
  const events: FriendsEvent[] = eventsData?.pages.flatMap((page) => page.events || []) || []

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: i18n.language === 'de' ? de : enUS,
      })
    } catch {
      return ''
    }
  }

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', {
          month: 'short',
        }),
        time: date.toLocaleTimeString(i18n.language === 'de' ? 'de-DE' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    } catch {
      return { day: '--', month: '---', time: '--:--' }
    }
  }

  const renderEmptyPosts = () => (
    <div className="text-center py-12">
      <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {t('friendsFeed.noPostsTitle', { defaultValue: 'Noch ist nichts los hier' })}
      </h3>
      <p className="text-muted-foreground">
        {t('friendsFeed.noPostsMessage', {
          defaultValue: 'Folge mehr Personen, um ihre Beiträge hier zu sehen.',
        })}
      </p>
    </div>
  )

  const renderEmptyEvents = () => (
    <div className="text-center py-12">
      <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {t('events.noEventsInSight')}
      </h3>
      <p className="text-muted-foreground">
        {t('friendsFeed.noEventsMessage', {
          defaultValue:
            'Deine Freunde nehmen noch an keinen kommenden Events teil. Schau später nochmal vorbei!',
        })}
      </p>
    </div>
  )

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t('friendsFeed.title', { defaultValue: 'Freunde' })}
        </h1>
        <p className="text-muted-foreground">
          {t('friendsFeed.subtitle', {
            defaultValue: 'Sieh was deine Freunde machen',
          })}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'events')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('friendsFeed.statusTab', { defaultValue: 'Status' })}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('friendsFeed.eventsTab', { defaultValue: 'Events' })}
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {/* Stories */}
          {user && <StoriesBar currentUserId={user._id || user.id || ''} />}

          {isLoadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            renderEmptyPosts()
          ) : (
            <>
              {posts.map((post) => {
                const postUser = (post as any).user || post.userId || {}
                const postUserId = postUser._id || postUser.id || post.userId

                return (
                  <Card key={post._id}>
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Link to={`/user/${postUserId}`}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={resolveImageUrl(postUser.profileImage)} />
                            <AvatarFallback>
                              {getInitials(postUser.name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link
                            to={`/user/${postUserId}`}
                            className="font-semibold hover:underline"
                          >
                            {postUser.name || postUser.username || 'User'}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      {post.text && (
                        <p className="mb-3 whitespace-pre-wrap">{post.text}</p>
                      )}

                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img
                            src={resolveImageUrl(post.images[0])}
                            alt="Post"
                            className="w-full max-h-[400px] object-cover"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className={post.hasLiked ? 'text-pink-500' : ''}>
                          ❤️ {post.likeCount || 0}
                        </span>
                        <Link
                          to={`/post/${post._id}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {post.comments?.length || 0}
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {hasNextPosts && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPosts()}
                    disabled={isFetchingNextPosts}
                  >
                    {isFetchingNextPosts ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('common.loadMore')
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="mb-4">
            <h3 className="font-semibold">
              {t('friendsFeed.upcomingEventsTitle', { defaultValue: 'Kommende Events' })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('friendsFeed.upcomingEventsSubtitle', {
                defaultValue: 'Events an denen du und deine Freunde teilnehmen',
              })}
            </p>
          </div>

          {isLoadingEvents ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : events.length === 0 ? (
            renderEmptyEvents()
          ) : (
            <>
              {events.map((item) => {
                const { event, attendees } = item
                if (!event?._id) return null

                const dateInfo = formatEventDate(event.eventStartTime)
                const displayedAttendees = attendees.slice(0, 3)
                const remainingCount = Math.max(attendees.length - 3, 0)

                return (
                  <Card
                    key={event._id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <CardContent className="p-4 flex gap-4">
                      {/* Event Image */}
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {event.locationImages?.[0]?.url ? (
                          <img
                            src={resolveImageUrl(event.locationImages[0].url)}
                            alt={event.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-white rounded px-1.5 py-0.5 text-center">
                          <span className="text-xs font-bold block">{dateInfo.day}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {dateInfo.month}
                          </span>
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold line-clamp-2">{event.name}</h4>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{dateInfo.time}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.locationName}</span>
                        </div>

                        {event.organizer?.name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">{event.organizer.name}</span>
                          </div>
                        )}

                        {/* Attendees */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2">
                            {displayedAttendees.map((attendee) => (
                              <Avatar key={attendee._id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={resolveImageUrl(attendee.profileImage)} />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(attendee.name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {remainingCount > 0 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-[10px]">+{remainingCount}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {attendees.length === 1 && attendees[0]?.name
                              ? t('friendsFeed.oneAttending', {
                                  name: attendees[0].name,
                                  defaultValue: `${attendees[0].name} nimmt teil`,
                                })
                              : t('friendsFeed.multipleAttending', {
                                  count: attendees.length,
                                  defaultValue: `${attendees.length} Freunde nehmen teil`,
                                })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {hasNextEvents && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextEvents()}
                    disabled={isFetchingNextEvents}
                  >
                    {isFetchingNextEvents ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('common.loadMore')
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
