import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService, Notification } from '@/services/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageCircle,
  Heart,
  UserPlus,
  Ticket,
  AlertTriangle,
  Star,
  PartyPopper,
} from 'lucide-react'

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    chat_message: <MessageCircle className="h-5 w-5 text-blue-500" />,
    event_reminder: <Calendar className="h-5 w-5 text-orange-500" />,
    event_ticket_purchased: <Ticket className="h-5 w-5 text-green-500" />,
    event_ticket_purchased_by_user: <Ticket className="h-5 w-5 text-green-500" />,
    event_ticket_cancelled: <Ticket className="h-5 w-5 text-red-500" />,
    ticket_cancelled: <Ticket className="h-5 w-5 text-red-500" />,
    event_approved: <Check className="h-5 w-5 text-green-500" />,
    event_rejected: <AlertTriangle className="h-5 w-5 text-red-500" />,
    event_pending_approval: <Calendar className="h-5 w-5 text-yellow-500" />,
    event_invitation: <PartyPopper className="h-5 w-5 text-blue-500" />,
    event_price_changed: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    event_location_changed: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    event_time_changed: <Calendar className="h-5 w-5 text-orange-500" />,
    event_policy_changed: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    event_emergency: <AlertTriangle className="h-5 w-5 text-red-500" />,
    event_reviewed: <Star className="h-5 w-5 text-yellow-500" />,
    organizer_new_subscriber: <UserPlus className="h-5 w-5 text-purple-500" />,
    organizer_new_event: <PartyPopper className="h-5 w-5 text-pink-500" />,
    safety_companion_request: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    safety_companion_accepted: <Check className="h-5 w-5 text-green-500" />,
    safety_companion_rejected: <AlertTriangle className="h-5 w-5 text-red-500" />,
    memory_like: <Heart className="h-5 w-5 text-red-500" />,
    memory_comment: <MessageCircle className="h-5 w-5 text-blue-500" />,
    memory_mention: <MessageCircle className="h-5 w-5 text-blue-500" />,
    memory_tag: <UserPlus className="h-5 w-5 text-blue-500" />,
    comment_reply: <MessageCircle className="h-5 w-5 text-blue-500" />,
    comment_mention: <MessageCircle className="h-5 w-5 text-blue-500" />,
    post_like: <Heart className="h-5 w-5 text-red-500" />,
    post_comment: <MessageCircle className="h-5 w-5 text-blue-500" />,
    post_mention: <MessageCircle className="h-5 w-5 text-blue-500" />,
    post_reaction: <Heart className="h-5 w-5 text-pink-500" />,
    story_like: <Heart className="h-5 w-5 text-red-500" />,
    story_reply: <MessageCircle className="h-5 w-5 text-blue-500" />,
    story_mention: <MessageCircle className="h-5 w-5 text-blue-500" />,
    comment_reaction: <Heart className="h-5 w-5 text-pink-500" />,
    review_received: <Star className="h-5 w-5 text-yellow-500" />,
    Announcement: <Bell className="h-5 w-5 text-blue-500" />,
  }
  return iconMap[type] || <Bell className="h-5 w-5 text-gray-500" />
}

export default function Notifications() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
    select: (data) => [...data].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    refetchOnMount: 'always',
    staleTime: 0,
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
      toast({ title: t('notifications.allMarkedAsRead') })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: notificationsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] })
      toast({ title: t('notifications.deleted') })
    },
  })

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read && !notification.isRead) {
      markAsReadMutation.mutate(notification._id)
    }

    // Memory-related notifications → navigate to memories with specific memory
    const memoryTypes = ['memory_tag', 'memory_like', 'memory_comment', 'memory_mention', 'memory_reaction', 'comment_reply', 'comment_mention']
    if (memoryTypes.includes(notification.type) && notification.eventId && notification.memoryId) {
      navigate(`/event/${notification.eventId}/memories`, {
        state: { memoryId: notification.memoryId, memoryIndex: notification.memoryIndex }
      })
      return
    }

    // Organizer new subscriber → Navigate to the new follower's profile
    if (notification.type === 'organizer_new_subscriber' && notification.sender?.id) {
      navigate(`/user/${notification.sender.id}`)
      return
    }

    // Navigate based on type
    if (notification.eventId) {
      navigate(`/event/${notification.eventId}`)
    } else if (notification.roomId) {
      const roomId = typeof notification.roomId === 'string' ? notification.roomId : notification.roomId
      navigate(`/chat/${roomId}`)
    } else if (notification.postId) {
      navigate(`/post/${notification.postId}`)
    } else {
      setSelectedNotification(notification)
    }
  }

  const unreadCount = notifications.filter(n => !n.read && !n.isRead).length

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-primary text-white text-sm rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {t('notifications.allRead')}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">{t('notifications.noNotifications')}</h3>
            <p className="text-muted-foreground">
              {t('notifications.noNotificationsReceived')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => {
            const isRead = notification.read || notification.isRead
            return (
              <Card
                key={notification._id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  !isRead && 'border-l-4 border-l-primary bg-primary/5'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon or Avatar */}
                    <div className="flex-shrink-0">
                      {notification.sender?.profileImage ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={resolveImageUrl(notification.sender.profileImage)} />
                          <AvatarFallback>
                            {getInitials(notification.sender.name || '')}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-medium', !isRead && 'text-primary')}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: i18n.language === 'de' ? de : enUS,
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMutation.mutate(notification._id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedNotification(null)}
        >
          <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedNotification.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                      addSuffix: true,
                      locale: i18n.language === 'de' ? de : enUS,
                    })}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">{selectedNotification.message}</p>
              <Button
                className="w-full mt-4"
                onClick={() => setSelectedNotification(null)}
              >
                {t('common.close')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
