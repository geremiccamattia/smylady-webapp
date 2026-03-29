import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, Search, MessageCircle, Users, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { organizerSubscriptionService, type OrganizerSubscriber } from '@/services/organizerSubscription'
import { chatService } from '@/services/chat'
import { getInitials, resolveImageUrl } from '@/lib/utils'

export default function OrganizerSubscribers() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeChatSubscriber, setActiveChatSubscriber] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Fetch subscribers
  const { data, isLoading } = useQuery({
    queryKey: ['organizerSubscribers', debouncedSearch],
    queryFn: () => organizerSubscriptionService.getSubscribers(debouncedSearch),
  })

  // Chat mutation
  const ensureChatMutation = useMutation({
    mutationFn: (subscriberId: string) => chatService.ensureChatRoom(subscriberId),
    onSuccess: (data) => {
      if (data?.roomId) {
        navigate(`/chat/${data.roomId}`)
      }
      setActiveChatSubscriber(null)
    },
    onError: () => {
      setActiveChatSubscriber(null)
    },
  })

  const subscribers: OrganizerSubscriber[] = useMemo(() => {
    return data?.subscribers ?? []
  }, [data])

  const totalSubscribers = data?.total ?? 0

  const handleOpenChat = (subscriberId: string) => {
    setActiveChatSubscriber(subscriberId)
    ensureChatMutation.mutate(subscriberId)
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('organizerSubscribers.title', { defaultValue: 'Meine Abonnenten' })}
          </h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">
          {t('organizerSubscribers.title', { defaultValue: 'Meine Abonnenten' })}
        </h1>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('organizerSubscribers.searchPlaceholder', {
            defaultValue: 'Abonnenten suchen',
          })}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Total Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {t('organizerSubscribers.total', {
          defaultValue: 'Gesamt: {{count}}',
          count: totalSubscribers,
        })}
      </p>

      {/* Subscribers List */}
      {subscribers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('profile.noSubscribers')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscribers.map((subscriber) => {
            const avatarUri = resolveImageUrl(subscriber.profileImage)
            const subscribedDate = format(new Date(subscriber.subscribedAt), 'dd. MMMM yyyy', {
              locale: de,
            })
            const isChatLoading = ensureChatMutation.isPending && activeChatSubscriber === subscriber.id

            return (
              <div
                key={subscriber.id}
                className="bg-card border rounded-lg p-4 flex items-center gap-4"
              >
                <Link to={`/user/${subscriber.id}`}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUri} />
                    <AvatarFallback>{getInitials(subscriber.name)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${subscriber.id}`}>
                    <p className="font-medium truncate hover:underline">{subscriber.name}</p>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {t('organizerSubscribers.subscribedOn', {
                      date: subscribedDate,
                      defaultValue: `Abonniert seit ${subscribedDate}`,
                    })}
                  </p>
                </div>
                <Button
                  size="icon"
                  onClick={() => handleOpenChat(subscriber.id)}
                  disabled={isChatLoading}
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
