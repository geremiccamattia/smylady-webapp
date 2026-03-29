import { useState, useRef, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  X,
  MessageCircle,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Flag,
  Smile,
  Star,
  Tag,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { memoriesService, Memory, getMemoryUrl, getMemoryType, getMemoryId, getMemoryDate, getUploadedByInfo } from '@/services/memories'
import { userService } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getInitials, formatRelativeTime, cn, resolveImageUrl } from '@/lib/utils'
import MentionInput, { RenderTextWithMentions, MentionUser, getMentionDisplayName } from '@/components/mentionInput/MentionInput'
import {
  EmojiReactionPicker,
} from '@/components/emojiReaction/EmojiReactionPicker'

interface PhotoTag {
  userId: string | { _id: string; name: string; profileImage?: string }
  x: number
  y: number
  user?: {
    _id: string
    name: string
    profileImage?: string
  }
}

interface Participant {
  _id: string
  name: string
  username?: string
  profileImage?: string
}

interface MemoryViewerProps {
  memory: Memory
  ticketId: string
  eventId?: string
  memoryIndex?: number
  onClose: () => void
  onDelete?: () => void
  onReaction?: (emoji: string) => void
  userReaction?: string
  reactionCount?: number
  onToggleHighlight?: () => void
  isHighlighted?: boolean
  photoTags?: PhotoTag[]
  participants?: Participant[]
  canTag?: boolean
  onAddTag?: (userId: string, x: number, y: number) => void
  onReport?: () => void
  onMemoryUpdate?: (updatedMemory: Memory) => void
}

export default function MemoryViewer({
  memory,
  ticketId,
  eventId: _eventId,
  onClose,
  onDelete,
  onReaction: _onReaction,
  userReaction,
  reactionCount = 0,
  onToggleHighlight,
  isHighlighted,
  photoTags = [],
  participants = [],
  canTag = false,
  onAddTag,
  onReport,
  onMemoryUpdate,
}: MemoryViewerProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const imageRef = useRef<HTMLImageElement>(null)

  const [comment, setComment] = useState('')
  const [commentMentions, setCommentMentions] = useState<string[]>([])
  const [showComments, setShowComments] = useState(true)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyMentions, setReplyMentions] = useState<string[]>([])
  const [replyInitialMentions, setReplyInitialMentions] = useState<MentionUser[]>([])

  // Single emoji picker with target (same pattern as Feed.tsx - proven to work)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [reactionTarget, setReactionTarget] = useState<{
    type: 'memory' | 'comment' | 'reply'
    commentIndex?: number
    replyIndex?: number
  } | null>(null)
  const reactionTargetRef = useRef<{
    type: 'memory' | 'comment' | 'reply'
    commentIndex?: number
    replyIndex?: number
  } | null>(null)

  // Photo tagging state
  const [isTagMode, setIsTagMode] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [pendingTagPosition, setPendingTagPosition] = useState<{ x: number; y: number } | null>(null)
  const [showTags, setShowTags] = useState(true)

  // Reactions modal state
  const [showReactionsModal, setShowReactionsModal] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close sub-modals first, then the viewer itself
        if (showEmojiPicker) {
          setShowEmojiPicker(false)
          setReactionTarget(null)
        } else if (showTagPicker) {
          setShowTagPicker(false)
          setPendingTagPosition(null)
        } else if (showReactionsModal) {
          setShowReactionsModal(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showEmojiPicker, showTagPicker, showReactionsModal])

  const currentUserId = user?.id || user?._id
  const effectiveTicketId = memory.ticketId || ticketId

  const memoryId = getMemoryId(memory)
  const memoryUrl = getMemoryUrl(memory)
  const memoryType = getMemoryType(memory)
  const uploadedByUser = getUploadedByInfo(memory)

  const mentionedUserIds = useMemo(() => {
    const ids = new Set<string>()

    const addMentionId = (mention: string | { _id?: string; id?: string } | null | undefined) => {
      if (!mention) return
      if (typeof mention === 'string') {
        ids.add(mention)
        return
      }

      const mentionId = mention._id || mention.id
      if (mentionId) {
        ids.add(mentionId)
      }
    }

    for (const commentItem of memory.comments || []) {
      for (const mentionId of commentItem.mentions || []) {
        addMentionId(mentionId as string | { _id?: string; id?: string })
      }

      for (const reply of commentItem.replies || []) {
        for (const mentionId of reply.mentions || []) {
          addMentionId(mentionId as string | { _id?: string; id?: string })
        }
      }
    }

    return [...ids]
  }, [memory.comments])

  const resolvedMentionQueries = useQueries({
    queries: mentionedUserIds.map((mentionUserId) => ({
      queryKey: ['memoryMentionUser', mentionUserId],
      queryFn: () => userService.getUserById(mentionUserId),
      enabled: !!mentionUserId,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const resolvedMentionUsers = useMemo(() => {
    return resolvedMentionQueries
      .map((query) => query.data)
      .filter((user): user is NonNullable<typeof user> => !!user)
      .map((user) => ({
        _id: user._id || user.id,
        name: user.name,
        username: user.username,
      }))
  }, [resolvedMentionQueries])

  // Helper: check if a response is a full Memory object (has memoryId or _id)
  const isMemoryResponse = (data: unknown): data is Memory => {
    return !!(data && typeof data === 'object' && ('memoryId' in data || '_id' in data))
  }

  // Add comment mutation - backend returns full Memory object
  const commentMutation = useMutation({
    mutationFn: ({ text, mentions }: { text: string; mentions?: string[] }) =>
      memoriesService.addComment(effectiveTicketId, memoryId, text, mentions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
      if (isMemoryResponse(data) && onMemoryUpdate) onMemoryUpdate(data)
      setComment('')
      setCommentMentions([])
      toast({ title: t('posts.commentAdded') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.commentAddError'), variant: 'destructive' })
    },
  })

  // Add reply mutation - backend returns full Memory object
  const replyMutation = useMutation({
    mutationFn: ({ commentIndex, text, mentions }: { commentIndex: number; text: string; mentions?: string[] }) =>
      memoriesService.addReply(effectiveTicketId, memoryId, commentIndex, text, mentions),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
      if (isMemoryResponse(data) && onMemoryUpdate) onMemoryUpdate(data)
      setReplyingTo(null)
      setReplyText('')
      setReplyMentions([])
      setReplyInitialMentions([])
      toast({ title: t('posts.replyAdded') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.replyAddError'), variant: 'destructive' })
    },
  })

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentIndex }: { commentIndex: number }) =>
      memoriesService.deleteComment(effectiveTicketId, memoryId, commentIndex),
    onSuccess: (_data, variables) => {
      // Optimistically remove the deleted comment from local state
      if (onMemoryUpdate) {
        const updatedComments = [...(memory.comments || [])]
        updatedComments.splice(variables.commentIndex, 1)
        onMemoryUpdate({ ...memory, comments: updatedComments })
      }
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
      toast({ title: t('posts.commentDeleted') })
    },
  })

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex }: { commentIndex: number; replyIndex: number }) =>
      memoriesService.deleteReply(effectiveTicketId, memoryId, commentIndex, replyIndex),
    onSuccess: (_data, variables) => {
      // Optimistically remove the deleted reply from local state
      if (onMemoryUpdate) {
        const updatedComments = memory.comments?.map((c, idx) => {
          if (idx === variables.commentIndex && c.replies) {
            const updatedReplies = [...c.replies]
            updatedReplies.splice(variables.replyIndex, 1)
            return { ...c, replies: updatedReplies }
          }
          return c
        }) || []
        onMemoryUpdate({ ...memory, comments: updatedComments })
      }
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
      toast({ title: t('posts.replyDeleted') })
    },
  })





  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    commentMutation.mutate({
      text: comment,
      mentions: commentMentions.length > 0 ? commentMentions : undefined
    })
  }

  const handleSubmitReply = (e: React.FormEvent, commentIndex: number) => {
    e.preventDefault()
    if (!replyText.trim()) return
    replyMutation.mutate({
      commentIndex,
      text: replyText,
      mentions: replyMentions.length > 0 ? replyMentions : undefined
    })
  }

  const isOwnComment = (commentUserId: string) => {
    return commentUserId === currentUserId
  }

  // Check if current user is the memory owner (can delete any comment/reply)
  const isMemoryOwner = (() => {
    if (!currentUserId || !uploadedByUser?._id) return false
    return uploadedByUser._id.toString() === currentUserId.toString()
  })()

  // Memory-level reaction mutation - backend returns { hasReacted, reactions, reactionCount }, NOT a Memory
  const memoryReactionMutation = useMutation({
    mutationFn: ({ emoji }: { emoji: string }) =>
      memoriesService.toggleReaction(effectiveTicketId, memoryId, emoji),
    onSuccess: (data) => {
      // Optimistically update local memory state with new reactions data
      if (onMemoryUpdate && data) {
        const updatedMemory: Memory = {
          ...memory,
          reactions: data.reactions.map(r => ({
            emoji: r.emoji,
            userId: r.userId,
            createdAt: r.createdAt
          }))
        }
        onMemoryUpdate(updatedMemory)
      }
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.reactionError'), variant: 'destructive' })
    },
  })

  // Comment-level reaction mutation
  const commentReactionMutation = useMutation({
    mutationFn: ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) =>
      memoriesService.toggleCommentReaction(effectiveTicketId, memoryId, commentIndex, emoji),
    onSuccess: (data, variables) => {
      // Optimistically update local memory state with new comment reactions
      if (onMemoryUpdate && data) {
        const updatedComments = memory.comments?.map((c, idx) => {
          if (idx === variables.commentIndex) {
            return { ...c, reactions: data.reactions }
          }
          return c
        }) || []
        onMemoryUpdate({ ...memory, comments: updatedComments })
      }
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.reactionError'), variant: 'destructive' })
    },
  })

  // Reply-level reaction mutation
  const replyReactionMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) =>
      memoriesService.toggleReplyReaction(effectiveTicketId, memoryId, commentIndex, replyIndex, emoji),
    onSuccess: (data, variables) => {
      // Optimistically update local memory state with new reply reactions
      if (onMemoryUpdate && data) {
        const updatedComments = memory.comments?.map((c, cIdx) => {
          if (cIdx === variables.commentIndex && c.replies) {
            const updatedReplies = c.replies.map((r, rIdx) => {
              if (rIdx === variables.replyIndex) {
                return { ...r, reactions: data.reactions }
              }
              return r
            })
            return { ...c, replies: updatedReplies }
          }
          return c
        }) || []
        onMemoryUpdate({ ...memory, comments: updatedComments })
      }
      queryClient.invalidateQueries({ queryKey: ['memories', effectiveTicketId] })
      queryClient.invalidateQueries({ queryKey: ['eventMemories'] })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.reactionError'), variant: 'destructive' })
    },
  })

  // Helper to get user's reaction on a comment or reply
  const getUserCommentReaction = (commentItem: { reactions?: Array<{ emoji: string; userId: string }> }): string | undefined => {
    if (!commentItem.reactions || !currentUserId) return undefined
    const reaction = commentItem.reactions.find(r => r.userId === currentUserId)
    return reaction?.emoji
  }

  // Single unified emoji select handler (same pattern as Feed.tsx)
  const handleEmojiSelect = (emoji: string) => {
    const target = reactionTargetRef.current
    if (!target) return

    if (target.type === 'memory') {
      memoryReactionMutation.mutate({ emoji })
    } else if (target.type === 'comment' && target.commentIndex !== undefined) {
      commentReactionMutation.mutate({ commentIndex: target.commentIndex, emoji })
    } else if (target.type === 'reply' && target.commentIndex !== undefined && target.replyIndex !== undefined) {
      replyReactionMutation.mutate({
        commentIndex: target.commentIndex,
        replyIndex: target.replyIndex,
        emoji,
      })
    }

    setShowEmojiPicker(false)
    setReactionTarget(null)
    reactionTargetRef.current = null
  }

  // Get current user reaction based on target
  const getCurrentUserReaction = (): string | undefined => {
    if (!reactionTarget) return undefined

    if (reactionTarget.type === 'memory') {
      return userReaction
    }
    if (reactionTarget.type === 'comment' && reactionTarget.commentIndex !== undefined) {
      return getUserCommentReaction(memory.comments?.[reactionTarget.commentIndex] || {})
    }
    if (reactionTarget.type === 'reply' && reactionTarget.commentIndex !== undefined && reactionTarget.replyIndex !== undefined) {
      return getUserCommentReaction(
        memory.comments?.[reactionTarget.commentIndex]?.replies?.[reactionTarget.replyIndex] || {}
      )
    }
    return undefined
  }

  // Open emoji picker for specific target
  const openMemoryEmojiPicker = () => {
    const target = { type: 'memory' as const }
    reactionTargetRef.current = target
    setReactionTarget(target)
    setShowEmojiPicker(true)
  }

  const openCommentEmojiPicker = (commentIndex: number) => {
    const target = { type: 'comment' as const, commentIndex }
    reactionTargetRef.current = target
    setReactionTarget(target)
    setShowEmojiPicker(true)
  }

  const openReplyEmojiPicker = (commentIndex: number, replyIndex: number) => {
    const target = { type: 'reply' as const, commentIndex, replyIndex }
    reactionTargetRef.current = target
    setReactionTarget(target)
    setShowEmojiPicker(true)
  }

  const handleMemoryReactionClick = () => {
    if (userReaction) {
      // Remove reaction by toggling same emoji
      memoryReactionMutation.mutate({ emoji: userReaction })
    } else {
      // Show picker
      openMemoryEmojiPicker()
    }
  }



  const handleReplyClick = (
    commentIndex: number,
    commentUser: { _id: string; name: string; username?: string; profileImage?: string }
  ) => {
    if (replyingTo === commentIndex) {
      setReplyingTo(null)
      setReplyText('')
      setReplyInitialMentions([])
    } else {
      setReplyingTo(commentIndex)
      const userName = getMentionDisplayName(commentUser)
      setReplyText(`@${userName} `)
      setReplyInitialMentions([{
        id: commentUser._id,
        name: commentUser.name,
        username: commentUser.username,
        profileImage: commentUser.profileImage,
      }])
    }
  }

  // Photo tagging handlers
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isTagMode || !canTag || !onAddTag) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setPendingTagPosition({ x, y })
    setShowTagPicker(true)
  }

  const handleTagUser = (userId: string) => {
    if (pendingTagPosition && onAddTag) {
      onAddTag(userId, pendingTagPosition.x, pendingTagPosition.y)
    }
    setShowTagPicker(false)
    setPendingTagPosition(null)
    setIsTagMode(false)
  }

  // Get unique emojis for memory reactions summary
  const getUniqueEmojis = () => {
    const emojis = memory.reactions?.map(r => r.emoji) || []
    return [...new Set(emojis)].slice(0, 3)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col md:flex-row overflow-hidden" onClick={onClose}>
      {/* Close button - positioned above sidebar */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 left-4 z-[60] bg-black/50 hover:bg-black/70 rounded-full p-2 text-white hover:text-gray-300 transition-colors"
        aria-label={t('common.close')}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Media Section - stop propagation to prevent closing when clicking image */}
      <div className="flex-1 flex items-center justify-center p-4 relative min-h-0 min-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {memoryType === 'video' ? (
          <video
            src={resolveImageUrl(memoryUrl)}
            controls
            autoPlay
            className="max-w-full max-h-[calc(60vh-2rem)] md:max-h-[calc(100vh-2rem)] rounded-lg"
          />
        ) : (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              ref={imageRef}
              src={resolveImageUrl(memoryUrl)}
              alt={memory.caption || 'Memory'}
              className={cn(
                'max-w-full max-h-[calc(60vh-2rem)] md:max-h-[calc(100vh-2rem)] object-contain rounded-lg',
                isTagMode && 'cursor-crosshair'
              )}
              onClick={handleImageClick}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />

            {/* Photo Tags */}
            {showTags && photoTags.map((tag, index) => {
              const tagUserId = typeof tag.userId === 'string' ? tag.userId : tag.userId?._id
              const tagUserName = tag.user?.name || (typeof tag.userId === 'object' ? tag.userId.name : 'User')
              return (
              <div
                key={index}
                className="absolute bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                onClick={() => navigate(`/user/${tagUserId}`)}
              >
                {tagUserName}
              </div>
            )})}

            {/* Pending tag marker */}
            {pendingTagPosition && (
              <div
                className="absolute w-6 h-6 bg-primary rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ left: `${pendingTagPosition.x}%`, top: `${pendingTagPosition.y}%` }}
              />
            )}
          </div>
        )}

        {/* Tag mode instructions */}
        {isTagMode && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg">
            {t('memories.clickToTag')}
          </div>
        )}
      </div>

      {/* Sidebar - stop propagation to prevent closing when interacting */}
      <div className="w-full md:w-96 md:max-w-md bg-background flex flex-col max-h-[40vh] md:max-h-full overflow-auto shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Avatar
            className="cursor-pointer"
            onClick={() => uploadedByUser?._id && navigate(`/user/${uploadedByUser._id}`)}
          >
            <AvatarImage src={resolveImageUrl(uploadedByUser?.profileImage)} />
            <AvatarFallback>{getInitials(uploadedByUser?.name || '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p
              className="font-medium cursor-pointer hover:underline"
              onClick={() => uploadedByUser?._id && navigate(`/user/${uploadedByUser._id}`)}
            >
              {uploadedByUser.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(getMemoryDate(memory))}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Tag button (only for own memory images) */}
            {canTag && memoryType !== 'video' && (
              <Button
                variant={isTagMode ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setIsTagMode(!isTagMode)}
                title={t('memories.tagPeople')}
              >
                <Tag className="w-5 h-5" />
              </Button>
            )}
            {/* Show/hide tags button */}
            {photoTags.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTags(!showTags)}
                title={showTags ? t('memories.hideTags') : t('memories.showTags')}
              >
                <Users className={cn('w-5 h-5', showTags && 'text-primary')} />
              </Button>
            )}
            {/* Highlight button (only for own memory) */}
            {onToggleHighlight && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleHighlight}
                title={isHighlighted ? t('memories.removeFromHighlights') : t('memories.addToHighlights')}
              >
                <Star className={cn('w-5 h-5', isHighlighted && 'fill-yellow-400 text-yellow-400')} />
              </Button>
            )}
            {onReport && (
              <Button variant="ghost" size="icon" onClick={onReport} title={t('common.report')}>
                <Flag className="w-5 h-5 text-muted-foreground" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-5 h-5 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {/* Caption */}
        {memory.caption && (
          <div className="p-4 border-b">
            <RenderTextWithMentions
              text={memory.caption}
              participants={participants}
              onMentionPress={(userId) => navigate(`/user/${userId}`)}
              className="text-sm"
            />
          </div>
        )}

        {/* Actions - Reactions */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            {/* Reaction button with emoji picker */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMemoryReactionClick}
                onContextMenu={(e) => {
                  e.preventDefault()
                  openMemoryEmojiPicker()
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {userReaction ? (
                  <span className="text-2xl">{userReaction}</span>
                ) : (
                  <span className="text-2xl opacity-50 hover:opacity-100">👍</span>
                )}
              </button>
              <button
                onClick={openMemoryEmojiPicker}
                className="text-muted-foreground hover:text-foreground"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            {/* Reaction summary */}
            {reactionCount > 0 && (
              <button
                onClick={() => setShowReactionsModal(true)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <div className="flex -space-x-1">
                  {getUniqueEmojis().map((emoji, idx) => (
                    <span
                      key={idx}
                      className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs border border-background"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
                <span>{reactionCount}</span>
              </button>
            )}

            {/* Comments toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 ml-auto"
            >
              <MessageCircle className="w-6 h-6" />
              <span>{memory.comments?.length || 0}</span>
              {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {memory.comments?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                {t('posts.noComments')}
              </p>
            )}
            {memory.comments?.map((commentItem, index) => (
              <div key={index} className="space-y-2">
                {/* Comment */}
                <div className="flex gap-2">
                  <Avatar
                    className="w-8 h-8 cursor-pointer"
                    onClick={() => commentItem.userId?._id && navigate(`/user/${commentItem.userId._id}`)}
                  >
                    <AvatarImage src={resolveImageUrl(commentItem.userId?.profileImage)} />
                    <AvatarFallback className="text-xs">
                      {getInitials(commentItem.userId?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <p
                        className="font-medium text-sm cursor-pointer hover:underline"
                        onClick={() => commentItem.userId?._id && navigate(`/user/${commentItem.userId._id}`)}
                      >
                        {commentItem.userId?.name || 'User'}
                      </p>
                      <RenderTextWithMentions
                        text={commentItem.text}
                        mentionedUsers={commentItem.mentionedUsers}
                        mentions={commentItem.mentions as any}
                        participants={participants}
                        resolvedMentionUsers={resolvedMentionUsers}
                        onMentionPress={(userId) => navigate(`/user/${userId}`)}
                        className="text-sm"
                      />
                    </div>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(commentItem.createdAt)}</span>
                      {/* Comment emoji reaction */}
                      {(() => {
                        const commentUserReaction = getUserCommentReaction(commentItem)
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (commentUserReaction) {
                                commentReactionMutation.mutate({ commentIndex: index, emoji: commentUserReaction })
                              } else {
                                openCommentEmojiPicker(index)
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openCommentEmojiPicker(index)
                            }}
                            className={cn(
                              'hover:text-foreground',
                              commentUserReaction && 'text-primary'
                            )}
                          >
                            {commentUserReaction ? (
                              <span>{commentUserReaction}</span>
                            ) : (
                              <Smile className="w-3.5 h-3.5 inline" />
                            )}
                          </button>
                        )
                      })()}
                      {/* Show comment reaction count */}
                      {commentItem.reactions && commentItem.reactions.length > 0 && (
                        <span className="text-xs">
                          {[...new Set(commentItem.reactions.map(r => r.emoji))].slice(0, 3).join('')}
                          {' '}{commentItem.reactions.length}
                        </span>
                      )}
                      <button
                        onClick={() => handleReplyClick(index, commentItem.userId)}
                        className="hover:text-foreground"
                      >
                        {t('posts.reply')}
                      </button>
                      {(isMemoryOwner || (commentItem.userId?._id && isOwnComment(commentItem.userId._id))) && (
                        <button
                          onClick={() => {
                            if (confirm(t('memories.deleteCommentConfirm'))) {
                              deleteCommentMutation.mutate({ commentIndex: index })
                            }
                          }}
                          className="hover:text-destructive"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {commentItem.replies && commentItem.replies.length > 0 && (
                  <div className="ml-10 space-y-2">
                    {commentItem.replies.map((reply, replyIndex) => (
                      <div key={replyIndex} className="flex gap-2">
                        <Avatar
                          className="w-6 h-6 cursor-pointer"
                          onClick={() => reply.userId?._id && navigate(`/user/${reply.userId._id}`)}
                        >
                          <AvatarImage src={resolveImageUrl(reply.userId?.profileImage)} />
                          <AvatarFallback className="text-xs">
                            {getInitials(reply.userId?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg px-3 py-2">
                            <p
                              className="font-medium text-xs cursor-pointer hover:underline"
                              onClick={() => reply.userId?._id && navigate(`/user/${reply.userId._id}`)}
                            >
                              {reply.userId?.name || 'User'}
                            </p>
                            <RenderTextWithMentions
                              text={reply.text}
                              mentionedUsers={reply.mentionedUsers}
                              mentions={reply.mentions as any}
                              participants={participants}
                              resolvedMentionUsers={resolvedMentionUsers}
                              onMentionPress={(userId) => navigate(`/user/${userId}`)}
                              className="text-sm"
                            />
                          </div>

                          {/* Reply Actions */}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatRelativeTime(reply.createdAt)}</span>
                            {/* Reply emoji reaction */}
                            {(() => {
                              const replyUserReaction = getUserCommentReaction(reply)
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (replyUserReaction) {
                                      replyReactionMutation.mutate({ commentIndex: index, replyIndex, emoji: replyUserReaction })
                                    } else {
                                      openReplyEmojiPicker(index, replyIndex)
                                    }
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openReplyEmojiPicker(index, replyIndex)
                                  }}
                                  className={cn(
                                    'hover:text-foreground',
                                    replyUserReaction && 'text-primary'
                                  )}
                                >
                                  {replyUserReaction ? (
                                    <span>{replyUserReaction}</span>
                                  ) : (
                                    <Smile className="w-3.5 h-3.5 inline" />
                                  )}
                                </button>
                              )
                            })()}
                            {/* Show reply reaction count */}
                            {reply.reactions && reply.reactions.length > 0 && (
                              <span className="text-xs">
                                {[...new Set(reply.reactions.map(r => r.emoji))].slice(0, 3).join('')}
                                {' '}{reply.reactions.length}
                              </span>
                            )}
                            {/* Reply to reply */}
                            <button
                              onClick={() => {
                                setReplyingTo(index)
                                const userName = getMentionDisplayName({
                                  name: reply.userId?.name || 'User',
                                  username: reply.userId?.username,
                                })
                                setReplyText(`@${userName} `)
                                setReplyMentions([])
                                setReplyInitialMentions([{
                                  id: reply.userId?._id,
                                  name: reply.userId?.name || 'User',
                                  username: reply.userId?.username,
                                  profileImage: reply.userId?.profileImage,
                                }])
                              }}
                              className="hover:text-foreground"
                            >
                              {t('posts.reply')}
                            </button>
                            {/* Delete reply (own reply or memory owner) */}
                            {(isMemoryOwner || (reply.userId?._id && isOwnComment(reply.userId._id))) && (
                              <button
                                onClick={() => {
                                  if (confirm(t('memories.deleteReplyConfirm'))) {
                                    deleteReplyMutation.mutate({ commentIndex: index, replyIndex })
                                  }
                                }}
                                className="hover:text-destructive"
                              >
                                {t('common.delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === index && (
                  <form
                    onSubmit={(e) => handleSubmitReply(e, index)}
                    className="ml-10 flex gap-2"
                  >
                    <MentionInput
                      value={replyText}
                      onChangeText={setReplyText}
                      onMentionsChange={setReplyMentions}
                      initialMentions={replyInitialMentions}
                      placeholder={t('posts.replyToUser', { name: commentItem.userId?.name || 'User' })}
                      className="text-sm"
                      rows={1}
                      autoFocus
                    />
                    <Button type="submit" size="icon" disabled={!replyText.trim() || replyMutation.isPending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="p-4 border-t flex gap-2">
          <MentionInput
            value={comment}
            onChangeText={setComment}
            onMentionsChange={setCommentMentions}
            placeholder={t('posts.writeComment')}
            className="text-sm"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={!comment.trim() || commentMutation.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Single Emoji Picker Modal - routes to memory/comment/reply based on reactionTarget */}
      <EmojiReactionPicker
        visible={showEmojiPicker}
        onClose={() => {
          setShowEmojiPicker(false)
          setReactionTarget(null)
          reactionTargetRef.current = null
        }}
        onSelectEmoji={handleEmojiSelect}
        currentUserReaction={getCurrentUserReaction()}
      />

      {/* Tag Picker Modal */}
      {showTagPicker && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg w-full max-w-sm max-h-[60vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{t('memories.tagPerson')}</h3>
              <button
                onClick={() => {
                  setShowTagPicker(false)
                  setPendingTagPosition(null)
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {participants.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">
                  {t('memories.noParticipants')}
                </p>
              ) : (
                participants.map((participant) => (
                  <button
                    key={participant._id}
                    onClick={() => handleTagUser(participant._id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={resolveImageUrl(participant.profileImage)} />
                      <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">{participant.name}</p>
                      {participant.username && (
                        <p className="text-sm text-muted-foreground">@{participant.username}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reactions Modal (Who reacted - memory level) */}
      {showReactionsModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg w-full max-w-sm max-h-[60vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{t('posts.reactions')}</h3>
              <button onClick={() => setShowReactionsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {memory.reactions && memory.reactions.length > 0 ? (
                memory.reactions.map((reaction, idx) => {
                  // Resolve user info from participants or uploadedBy
                  const participant = participants.find(p => p._id === reaction.userId)
                  const isUploader = uploadedByUser._id === reaction.userId
                  const displayName = participant?.name || (isUploader ? uploadedByUser.name : null) || t('common.user')
                  const displayImage = participant?.profileImage || (isUploader ? uploadedByUser.profileImage : undefined)
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setShowReactionsModal(false)
                        navigate(`/user/${reaction.userId}`)
                      }}
                    >
                      <span className="text-xl">{reaction.emoji}</span>
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={resolveImageUrl(displayImage)} />
                        <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{displayName}</span>
                    </div>
                  )
                })
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  {t('posts.noReactions')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
