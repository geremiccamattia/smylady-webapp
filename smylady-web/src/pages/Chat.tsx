import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { chatService } from '@/services/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, MessageCircle, Image as ImageIcon, Wifi, WifiOff, MapPin, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { ChatRoom, ChatMessagesResponse, ChatMessage } from '@/types'
import { useTranslation } from 'react-i18next'

export default function Chat() {
  const { t } = useTranslation()
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isConnected, joinChat, leaveChat, markAsRead } = useSocket()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedMessages = useRef<Set<string>>(new Set())

  // Fetch conversations list (chat rooms)
  const { data: chatRooms = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  })

  // Fetch messages for selected conversation
  const { data: chatData, isLoading: loadingMessages, refetch: refetchMessages } = useQuery<ChatMessagesResponse>({
    queryKey: ['messages', conversationId],
    queryFn: () => chatService.getMessages(conversationId!),
    enabled: !!conversationId,
    // Use WebSocket for real-time updates, fallback to polling if not connected
    refetchInterval: isConnected ? false : 5000,
  })

  // Join chat room when conversation changes
  useEffect(() => {
    if (conversationId) {
      joinChat(conversationId)
      markAsRead(conversationId)
      processedMessages.current.clear()
    }

    return () => {
      if (conversationId) {
        leaveChat(conversationId)
      }
    }
  }, [conversationId, joinChat, leaveChat, markAsRead])

  // Listen for new messages and update cache
  useEffect(() => {
    if (!conversationId || !chatData) return

    // Process messages to avoid duplicates
    chatData.messages?.forEach((msg: ChatMessage) => {
      if (msg._id && !processedMessages.current.has(msg._id)) {
        processedMessages.current.add(msg._id)
      }
    })
  }, [conversationId, chatData])

  // Get messages array from response
  const messages = chatData?.messages || []

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Find the selected chat room
  const selectedRoom: ChatRoom | undefined = chatRooms.find(
    (room) => room.roomId === conversationId
  )

  // Get the other user info - from the selected room or from the messages response
  const otherUser = selectedRoom?.otherUser || chatData?.otherUser

  // Function to render message content with clickable links
  const renderMessageContent = (content: string, isOwn: boolean) => {
    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Reset regex lastIndex
        urlRegex.lastIndex = 0
        // Check if it's a Google Maps link
        const isMapLink = part.includes('google.com/maps') || part.includes('maps.google')

        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1 underline hover:opacity-80",
              isOwn ? "text-white" : "text-primary"
            )}
          >
            {isMapLink ? (
              <>
                <MapPin className="h-3 w-3 inline" />
                {t('chat.openInMaps')}
                <ExternalLink className="h-3 w-3 inline" />
              </>
            ) : (
              part
            )}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !otherUser) return

    const tempId = 'temp-' + Date.now()
    const messageContent = message.trim()

    // Optimistically add message to cache immediately
    queryClient.setQueryData(['messages', conversationId], (old: ChatMessagesResponse | undefined) => {
      if (!old) return old
      const tempMessage: ChatMessage = {
        _id: tempId,
        senderId: user?.id || user?._id || '',
        receiverId: otherUser.id,
        content: messageContent,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isRead: false,
      } as ChatMessage
      return { ...old, messages: [...(old.messages || []), tempMessage] }
    })

    setMessage('')
    setIsSending(true)
    try {
      await chatService.sendMessage(otherUser.id, messageContent)
      // Refetch to get the real message with server ID (replaces temp message)
      refetchMessages()
    } catch (error) {
      // Rollback optimistic update on error
      queryClient.setQueryData(['messages', conversationId], (old: ChatMessagesResponse | undefined) => {
        if (!old) return old
        return { ...old, messages: (old.messages || []).filter((m: ChatMessage) => m._id !== tempId) }
      })
      setMessage(messageContent) // Restore message text
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('chat.couldNotSend'),
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)]">
      <div className="grid md:grid-cols-3 h-full gap-4">
        {/* Conversations List */}
        <div className={cn(
          "md:col-span-1 bg-card rounded-xl border overflow-hidden flex flex-col",
          conversationId && "hidden md:flex"
        )}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">{t('chat.title')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chatRooms && chatRooms.length > 0 ? (
              <div className="divide-y">
                {chatRooms.map((room) => {
                  const isActive = room.roomId === conversationId
                  const displayName = room.isGroup
                    ? room.groupName
                    : room.otherUser?.name || t('common.unknownUser')
                  const displayImage = room.isGroup
                    ? room.groupImage
                    : room.otherUser?.image
                  const lastMessage = room.lastMessages?.[0]
                  
                  return (
                    <Link
                      key={room.roomId}
                      to={`/chat/${room.roomId}`}
                      className={cn(
                        "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors",
                        isActive && "bg-primary/10"
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={resolveImageUrl(displayImage)} />
                        <AvatarFallback className="gradient-bg text-white">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{displayName}</p>
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      {room.unreadMessagesCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          {room.unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">{t('chat.noMessages')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "md:col-span-2 bg-card rounded-xl border overflow-hidden flex flex-col",
          !conversationId && "hidden md:flex"
        )}>
          {conversationId && (selectedRoom || chatData) ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Link to="/chat" className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <Avatar>
                  <AvatarImage src={resolveImageUrl(chatData?.isGroup ? chatData.groupImage : otherUser?.image)} />
                  <AvatarFallback className="gradient-bg text-white">
                    {getInitials(chatData?.isGroup ? chatData.groupName : otherUser?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {chatData?.isGroup ? chatData.groupName : otherUser?.name || t('common.unknownUser')}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span>{chatData?.isGroup ? t('common.members', { count: chatData.members?.length || 0 }) : t('common.online')}</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-yellow-500" />
                        <span>{t('common.connecting')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={cn(
                        "flex",
                        i % 2 === 0 ? "justify-start" : "justify-end"
                      )}>
                        <div className={cn(
                          "h-10 rounded-xl animate-pulse",
                          i % 2 === 0 ? "w-3/4 bg-muted" : "w-1/2 bg-primary/20"
                        )} />
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <>
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === (user?.id || user?._id)
                      
                      return (
                        <div
                          key={msg._id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] px-4 py-2 rounded-2xl",
                              isOwn
                                ? "gradient-bg text-white rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            {/* Show sender name in group chats */}
                            {chatData?.isGroup && !isOwn && msg.senderName && (
                              <p className="text-xs font-medium mb-1 text-primary">
                                {msg.senderName}
                              </p>
                            )}
                            {msg.media?.url ? (
                              <img
                                src={resolveImageUrl(msg.media.url)}
                                alt="Shared image"
                                className="max-w-full rounded-lg"
                              />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">
                                {renderMessageContent(msg.content, isOwn)}
                              </p>
                            )}
                            <p className={cn(
                              "text-xs mt-1",
                              isOwn ? "text-white/70" : "text-muted-foreground"
                            )}>
                              {new Date(msg.timestamp).toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">{t('chat.noMessagesYet')}</p>
                      <p className="text-sm text-muted-foreground">{t('chat.sendFirst')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Button type="button" variant="ghost" size="icon">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('chat.writeMessage')}
                  className="flex-1"
                />
                <Button type="submit" variant="gradient" size="icon" disabled={!message.trim() || isSending}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">{t('chat.selectConversation')}</h3>
                <p className="text-muted-foreground">
                  {t('chat.selectOrStart')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
