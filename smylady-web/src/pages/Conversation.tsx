import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ChevronLeft,
  Send,
  Paperclip,
  MapPin,
  Trash2,
  X,
  Loader2,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { chatService, type Message } from '@/services/chat'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getInitials, resolveImageUrl, formatRelativeTime } from '@/lib/utils'

export default function Conversation() {
  const { t } = useTranslation()
  const { conversationId } = useParams<{ conversationId: string }>()
  const [searchParams] = useSearchParams()
  const recipientId = searchParams.get('recipientId')
  const recipientName = searchParams.get('recipientName')
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch chat room
  const {
    data: chat,
    isLoading: isChatLoading,
    refetch,
  } = useQuery({
    queryKey: ['chatRoom', conversationId],
    queryFn: () => chatService.getChatRoomById(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: string; content: string; file?: File }) =>
      chatService.sendMessage(data.receiverId, data.content, data.file),
    onSuccess: () => {
      setMessage('')
      setSelectedFile(null)
      setSelectedMessage(null)
      refetch()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('chat.couldNotSend'),
      })
    },
  })

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: () => chatService.deleteChat(conversationId!),
    onSuccess: () => {
      toast({
        description: t('chat.chatDeleted'),
      })
      navigate('/chat')
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('chat.deleteError'),
      })
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages])

  // Mark messages as read
  useEffect(() => {
    if (conversationId) {
      chatService.markAsRead(conversationId).catch(() => {})
    }
  }, [conversationId, chat?.messages?.length])

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return

    const receiverId = recipientId || chat?.otherUser?.id || chat?.otherUser?._id
    if (!receiverId) return

    sendMessageMutation.mutate({
      receiverId,
      content: message,
      file: selectedFile || undefined,
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleLocationShare = async () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        description: t('chat.locationNotSupported'),
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        const receiverId = recipientId || chat?.otherUser?.id || chat?.otherUser?._id

        if (receiverId) {
          sendMessageMutation.mutate({
            receiverId,
            content: `📍 ${t('chat.myLocation')}\n${mapUrl}`,
          })
        }
      },
      () => {
        toast({
          variant: 'destructive',
          description: t('chat.locationError'),
        })
      }
    )
  }

  const displayName =
    recipientName ||
    (chat && !chat.otherUser ? t('chat.deletedUser') : chat?.otherUser?.name)
  const displayImage = resolveImageUrl(chat?.otherUser?.image || chat?.otherUser?.profileImage)
  const otherUserId = recipientId || chat?.otherUser?.id || chat?.otherUser?._id
  const currentUserId = currentUser?._id || currentUser?.id

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
            className={`inline-flex items-center gap-1 underline hover:opacity-80 ${
              isOwn ? 'text-white' : 'text-primary'
            }`}
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

  if (isChatLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-4 p-4 border-b">
          <Link to="/chat">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-3/4 ml-auto" />
          <Skeleton className="h-16 w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Link to="/chat">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          {otherUserId ? (
            <Link to={`/user/${otherUserId}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayImage} />
                <AvatarFallback>{getInitials(displayName || '')}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{displayName || t('chat.newUser')}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(displayName || '')}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{displayName || t('chat.newUser')}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleteChatMutation.isPending}
        >
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!chat?.messages || chat.messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t('chat.sendFirst')}
            </p>
          </div>
        ) : (
          chat.messages.map((msg: Message) => {
            const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id || msg.senderId?.id : msg.senderId
            const isOwn = senderId === currentUserId
            const msgId = msg.id || msg._id

            return (
              <div
                key={msgId}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isOwn
                      ? 'bg-pink-500 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {msg.file && (
                    <img
                      src={resolveImageUrl(msg.file)}
                      alt="Attachment"
                      className="rounded-lg max-w-full mb-2"
                    />
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {renderMessageContent(msg.content, isOwn)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-white/70' : 'text-muted-foreground'
                    }`}
                  >
                    {formatRelativeTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {selectedMessage && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs text-muted-foreground">
              {t('chat.replyTo')}
            </p>
            <p className="text-sm truncate">{selectedMessage.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLocationShare}>
            <MapPin className="h-5 w-5" />
          </Button>
          <Input
            placeholder={t('chat.writeMessage')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('chat.deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('chat.deleteConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteChatMutation.mutate()}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
