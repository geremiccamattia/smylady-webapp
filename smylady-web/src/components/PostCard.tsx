'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { postsService, Post, Comment, LikedByUser } from '@/services/posts'
import { useAuth } from '@/contexts/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl, generateEventSlug, generateCommunitySlug } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLocalePath } from '@/hooks/useLocalePath'
import {
  EmojiReactionPicker,
  EmojiReactionDisplay,
  getUserReaction,
  ReactionsModal,
  DEFAULT_LIKE_EMOJI,
} from '@/components/emojiReaction/EmojiReactionPicker'
import MentionInput, { RenderTextWithMentions } from '@/components/mentionInput/MentionInput'
import ReportModal from '@/components/ReportModal'
import { ImageViewer } from '@/components/ImageViewer'
import { SpotifyTrackPreview } from '@/components/SpotifyTrackPreview'
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Trash2,
  Edit,
  Flag,
  Loader2,
  Smile,
  AlertTriangle,
  Calendar,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface PostCardProps {
  post: Post
  communityId?: string
}

// Post Card Component
export function PostCard({ post, communityId }: PostCardProps) {
  const { user, isAuthenticated } = useAuth()
  const { requireAuth } = useRequireAuth()
  const { toast } = useToast()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()
  const localePath = useLocalePath()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentMentions, setCommentMentions] = useState<string[]>([])
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyMentions, setReplyMentions] = useState<string[]>([])

  // Emoji reaction state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [reactionTarget, setReactionTarget] = useState<{
    type: 'post' | 'comment' | 'reply'
    commentIndex?: number
    replyIndex?: number
  } | null>(null)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [reactedUsers, setReactedUsers] = useState<LikedByUser[]>([])
  const [loadingReactions, setLoadingReactions] = useState(false)
  const [postImageViewerOpen, setPostImageViewerOpen] = useState(false)
  const [postImageViewerIndex, setPostImageViewerIndex] = useState(0)

  // Report state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment'
    commentIndex?: number
  } | null>(null)

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Get post user info - backend returns user info in "user" field (populated),
  // fallback to "userId" if it's a populated object
  const postUser = (post as any).user || (typeof post.userId === 'object' ? post.userId : null) || { _id: post.userId, name: 'User', profileImage: undefined }
  const postUserId = postUser._id || postUser.id || (typeof post.userId === 'string' ? post.userId : post.userId?._id)

  // Robust ID comparison using toString() - like mobile app
  const isOwnPost = (() => {
    if (!user || !postUserId) return false
    const currentUserId = (user.id || user._id)?.toString()
    const ownerId = postUserId?.toString()
    return currentUserId === ownerId
  })()
  const currentUserId = user?.id || user?._id

  // Helper: optimistically toggle a reaction in an array
  const toggleReactionOptimistic = (reactions: any[], emoji: string, userId: string) => {
    const existing = reactions.findIndex(
      (r: any) => (r.userId?.toString() === userId?.toString() || r.userId?._id?.toString() === userId?.toString()) && r.emoji === emoji
    )
    if (existing >= 0) {
      return reactions.filter((_: any, i: number) => i !== existing)
    }
    // Remove any other reaction from this user first
    const filtered = reactions.filter(
      (r: any) => r.userId?.toString() !== userId?.toString() && r.userId?._id?.toString() !== userId?.toString()
    )
    return [...filtered, { userId, emoji, createdAt: new Date().toISOString() }]
  }

  // Helper: update a specific post in the infinite feed cache
  const updatePostInFeedCache = (postId: string, updater: (p: Post) => Post) => {
    // Feed-Cache
    queryClient.setQueryData(['feed'], (old: any) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: (page.posts || []).map((p: Post) =>
            p._id === postId ? updater(p) : p
          ),
        })),
      }
    })
    // Community-Posts-Cache
    if (communityId) {
      queryClient.invalidateQueries({ queryKey: ['communityPosts', communityId] })
    }
  }

  // Post reaction mutation (emoji-based likes, like mobile app) with optimistic update
  const postReactionMutation = useMutation({
    mutationFn: (emoji: string) => postsService.togglePostReaction(post._id, emoji),
    onMutate: async (emoji: string) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => ({
        ...p,
        reactions: toggleReactionOptimistic(p.reactions || [], emoji, currentUserId!),
      }))
      return { previousFeed }
    },
    onError: (_err, _emoji, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  // Handle post like (tap = toggle 👍, like mobile app)
  const handlePostLike = () => {
    const userReaction = getUserReaction(post.reactions || [], currentUserId)
    if (userReaction) {
      postReactionMutation.mutate(userReaction)
    } else if (post.hasLiked) {
      postReactionMutation.mutate(DEFAULT_LIKE_EMOJI)
    } else {
      postReactionMutation.mutate(DEFAULT_LIKE_EMOJI)
    }
  }

  // Handle post emoji reaction (from picker)
  const handlePostEmojiReaction = (emoji: string) => {
    postReactionMutation.mutate(emoji)
  }

  // Show who liked/reacted on a post
  const handleShowPostReactions = async () => {
    const reactionsCount = post.reactions?.length || 0
    const totalCount = (post.likeCount || 0) + reactionsCount
    if (totalCount === 0) return
    setShowReactionsModal(true)
    setLoadingReactions(true)
    try {
      if (!isAuthenticated) {
        const usersFromReactions = (post.reactions || []).map((r: any) => {
          const u = typeof r.userId === 'object' ? r.userId : { _id: r.userId }
          return {
            _id: u._id || u.id || '',
            name: u.name || 'User',
            username: u.username,
            profileImage: u.profileImage,
            emoji: r.emoji,
          }
        })
        setReactedUsers(usersFromReactions)
        return
      }
      const [likeUsers, reactionUsers] = await Promise.all([
        postsService.getPostLikes(post._id),
        postsService.getPostReactions(post._id),
      ])
      const likeUsersWithEmoji = likeUsers.map(u => ({ ...u, emoji: u.emoji || '❤️' }))
      const allUsers = [...reactionUsers]
      const reactionUserIds = new Set(reactionUsers.map(u => u._id))
      for (const lu of likeUsersWithEmoji) {
        if (!reactionUserIds.has(lu._id)) {
          allUsers.push(lu)
        }
      }
      setReactedUsers(allUsers)
    } catch (error) {
      console.error('Error loading post reactions:', error)
    } finally {
      setLoadingReactions(false)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: () => postsService.delete(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: ['communityPosts', communityId] })
      }
      toast({ title: t('posts.postDeleted') })
    },
  })

  const commentMutation = useMutation({
    mutationFn: ({ content, mentions }: { content: string; mentions?: string[] }) =>
      postsService.addComment(post._id, content, mentions),
    onMutate: async ({ content }: { content: string; mentions?: string[] }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => ({
        ...p,
        comments: [...(p.comments || []), {
          _id: 'temp-' + Date.now(),
          text: content,
          userId: currentUserId,
          user: { _id: currentUserId, name: user?.name || user?.username || 'User', profileImage: user?.profileImage },
          createdAt: new Date().toISOString(),
          reactions: [],
          replies: [],
        } as any],
        commentCount: (p.commentCount || 0) + 1,
      }))
      return { previousFeed }
    },
    onSuccess: () => {
      setCommentText('')
      setCommentMentions([])
      toast({ title: t('posts.commentAdded') })
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ commentIndex, text, mentions }: { commentIndex: number; text: string; mentions?: string[] }) =>
      postsService.addReply(post._id, commentIndex, text, mentions),
    onMutate: async ({ commentIndex, text }: { commentIndex: number; text: string; mentions?: string[] }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => {
        const updatedComments = [...(p.comments || [])]
        if (updatedComments[commentIndex]) {
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            replies: [...(updatedComments[commentIndex].replies || []), {
              _id: 'temp-' + Date.now(),
              text,
              userId: currentUserId,
              user: { _id: currentUserId, name: user?.name || user?.username || 'User', profileImage: user?.profileImage },
              createdAt: new Date().toISOString(),
              reactions: [],
            } as any],
          }
        }
        return { ...p, comments: updatedComments }
      })
      return { previousFeed }
    },
    onSuccess: () => {
      setReplyText('')
      setReplyMentions([])
      setReplyingTo(null)
      toast({ title: t('posts.replyAdded') })
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const commentReactionMutation = useMutation({
    mutationFn: ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) =>
      postsService.toggleCommentReaction(post._id, commentIndex, emoji),
    onMutate: async ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => {
        const updatedComments = [...(p.comments || [])]
        if (updatedComments[commentIndex]) {
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            reactions: toggleReactionOptimistic(updatedComments[commentIndex].reactions || [], emoji, currentUserId!),
          }
        }
        return { ...p, comments: updatedComments }
      })
      return { previousFeed }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const replyReactionMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) =>
      postsService.toggleReplyReaction(post._id, commentIndex, replyIndex, emoji),
    onMutate: async ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => {
        const updatedComments = [...(p.comments || [])]
        if (updatedComments[commentIndex]?.replies?.[replyIndex]) {
          const updatedReplies = [...updatedComments[commentIndex].replies]
          updatedReplies[replyIndex] = {
            ...updatedReplies[replyIndex],
            reactions: toggleReactionOptimistic(updatedReplies[replyIndex].reactions || [], emoji, currentUserId!),
          }
          updatedComments[commentIndex] = { ...updatedComments[commentIndex], replies: updatedReplies }
        }
        return { ...p, comments: updatedComments }
      })
      return { previousFeed }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentIndex: number) => postsService.deleteCommentByIndex(post._id, commentIndex),
    onMutate: async (commentIndex: number) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => {
        const updatedComments = [...(p.comments || [])]
        updatedComments.splice(commentIndex, 1)
        return { ...p, comments: updatedComments, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
      })
      return { previousFeed }
    },
    onSuccess: () => {
      toast({ title: t('posts.commentDeleted') })
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex }: { commentIndex: number; replyIndex: number }) =>
      postsService.deleteReplyByIndex(post._id, commentIndex, replyIndex),
    onMutate: async ({ commentIndex, replyIndex }: { commentIndex: number; replyIndex: number }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      updatePostInFeedCache(post._id, (p) => {
        const updatedComments = [...(p.comments || [])]
        if (updatedComments[commentIndex]?.replies) {
          const updatedReplies = [...updatedComments[commentIndex].replies]
          updatedReplies.splice(replyIndex, 1)
          updatedComments[commentIndex] = { ...updatedComments[commentIndex], replies: updatedReplies }
        }
        return { ...p, comments: updatedComments }
      })
      return { previousFeed }
    },
    onSuccess: () => {
      toast({ title: t('posts.replyDeleted') })
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate({
        content: commentText.trim(),
        mentions: commentMentions.length > 0 ? commentMentions : undefined
      })
    }
  }

  const handleSubmitReply = (commentIndex: number) => {
    if (replyText.trim()) {
      replyMutation.mutate({
        commentIndex,
        text: replyText.trim(),
        mentions: replyMentions.length > 0 ? replyMentions : undefined,
      })
    }
  }

  // Emoji handlers
  const handleEmojiSelect = (emoji: string) => {
    if (!reactionTarget) return

    if (reactionTarget.type === 'post') {
      handlePostEmojiReaction(emoji)
    } else if (reactionTarget.type === 'comment' && reactionTarget.commentIndex !== undefined) {
      commentReactionMutation.mutate({ commentIndex: reactionTarget.commentIndex, emoji })
    } else if (reactionTarget.type === 'reply' && reactionTarget.commentIndex !== undefined && reactionTarget.replyIndex !== undefined) {
      replyReactionMutation.mutate({
        commentIndex: reactionTarget.commentIndex,
        replyIndex: reactionTarget.replyIndex,
        emoji,
      })
    }

    setShowEmojiPicker(false)
    setReactionTarget(null)
  }

  const openPostEmojiPicker = () => {
    setReactionTarget({ type: 'post' })
    setShowEmojiPicker(true)
  }

  const openCommentEmojiPicker = (commentIndex: number) => {
    setReactionTarget({ type: 'comment', commentIndex })
    setShowEmojiPicker(true)
  }

  const openReplyEmojiPicker = (commentIndex: number, replyIndex: number) => {
    setReactionTarget({ type: 'reply', commentIndex, replyIndex })
    setShowEmojiPicker(true)
  }

  const getCurrentUserReaction = (): string | undefined => {
    if (!reactionTarget) return undefined

    if (reactionTarget.type === 'post') {
      return getUserReaction(post.reactions || [], currentUserId)
    }
    if (reactionTarget.type === 'comment' && reactionTarget.commentIndex !== undefined) {
      return getUserReaction(post.comments?.[reactionTarget.commentIndex]?.reactions || [], currentUserId)
    }
    if (reactionTarget.type === 'reply' && reactionTarget.commentIndex !== undefined && reactionTarget.replyIndex !== undefined) {
      return getUserReaction(
        post.comments?.[reactionTarget.commentIndex]?.replies?.[reactionTarget.replyIndex]?.reactions || [],
        currentUserId
      )
    }
    return undefined
  }

  const handleShowCommentReactions = async (commentIndex: number) => {
    setShowReactionsModal(true)
    setLoadingReactions(true)
    try {
      const users = await postsService.getCommentReactions(post._id, commentIndex)
      setReactedUsers(users)
    } catch (error) {
      console.error('Error loading reactions:', error)
    } finally {
      setLoadingReactions(false)
    }
  }

  const handleShowReplyReactions = async (commentIndex: number, replyIndex: number) => {
    setShowReactionsModal(true)
    setLoadingReactions(true)
    try {
      const users = await postsService.getReplyReactions(post._id, commentIndex, replyIndex)
      setReactedUsers(users)
    } catch (error) {
      console.error('Error loading reactions:', error)
    } finally {
      setLoadingReactions(false)
    }
  }

  const isOwnComment = (comment: Comment) => {
    if (!currentUserId) return false

    // Extract comment user ID - check multiple possible locations
    // 1. user._id (populated user object)
    // 2. user.id (alternative id field)
    // 3. userId._id (if userId is populated object)
    // 4. userId (if userId is a string)
    let commentUserId: string | undefined

    // First check the populated user object
    const commentUser = (comment as any).user
    if (commentUser && typeof commentUser === 'object') {
      commentUserId = commentUser._id || commentUser.id
    }

    // If not found, check userId field
    if (!commentUserId) {
      if (typeof comment.userId === 'object' && comment.userId !== null) {
        commentUserId = (comment.userId as any)._id || (comment.userId as any).id
      } else if (typeof comment.userId === 'string') {
        commentUserId = comment.userId
      }
    }

    if (!commentUserId) return false

    // Use .toString() for robust ID comparison (MongoDB ObjectID vs String)
    return commentUserId.toString() === currentUserId.toString()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwnReply = (reply: any) => {
    if (!currentUserId) return false

    // Extract reply user ID - check multiple possible locations
    let replyUserId: string | undefined

    // First check the populated user object
    const replyUser = reply.user
    if (replyUser && typeof replyUser === 'object') {
      replyUserId = replyUser._id || replyUser.id
    }

    // If not found, check userId field
    if (!replyUserId) {
      if (typeof reply.userId === 'object' && reply.userId !== null) {
        replyUserId = reply.userId._id || reply.userId.id
      } else if (typeof reply.userId === 'string') {
        replyUserId = reply.userId
      }
    }

    if (!replyUserId) return false

    // Use .toString() for robust ID comparison (MongoDB ObjectID vs String)
    return replyUserId.toString() === currentUserId.toString()
  }

  // Helper to get user info from comment/reply
  const getCommentUser = (comment: Comment) => {
    return (comment as any).user || (typeof comment.userId === 'object' ? comment.userId : null) || { _id: comment.userId, name: 'User', profileImage: undefined }
  }

  const getReplyUser = (reply: any) => {
    return reply.user || (typeof reply.userId === 'object' ? reply.userId : null) || { _id: reply.userId, name: 'User', profileImage: undefined }
  }

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'de' ? de : enUS,
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={`/user/${postUserId}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveImageUrl(postUser.profileImage)} />
                <AvatarFallback>{getInitials(postUser.name || '')}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/user/${postUserId}`}
                className="font-medium hover:underline"
              >
                {postUser.name || 'User'}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </p>
              {post.communityId && (
                <Link href={localePath(`/communities/${
                  typeof post.communityId === 'object' && (post.communityId as any).name
                    ? generateCommunitySlug((post.communityId as any).name, (post.communityId as any)._id)
                    : (post.communityId as any)._id || post.communityId
                }`)}>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-medium hover:bg-primary/20 transition-colors">
                    🏘 {(post.communityId as any).name || 'Community'}
                  </span>
                </Link>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setReportTarget({ type: 'post' })
                    setShowReportModal(true)
                  }}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {t('posts.report')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <RenderTextWithMentions
          text={post.text || post.content || ''}
          mentions={post.mentions}
          mentionedUsers={post.mentionedUsers}
          onMentionPress={(userId) => router.push(`/user/${userId}`)}
          className="mb-4 whitespace-pre-wrap block"
        />

        {/* Shared Song */}
        {post.spotifyTrack && (
          <div className="mb-4">
            <SpotifyTrackPreview track={post.spotifyTrack} />
          </div>
        )}

        {/* Media/Images */}
        {((post.media && post.media.length > 0) || (post.images && post.images.length > 0)) && (
          <div className={cn(
            'grid gap-2 mb-4',
            (post.media?.length || post.images?.length || 0) === 1 ? 'grid-cols-1' : 'grid-cols-2'
          )}>
            {post.media ? (
              post.media.map((media, idx) => (
                media.type === 'video' ? (
                  <video
                    key={idx}
                    src={resolveImageUrl(media.url)}
                    controls
                    className="rounded-lg w-full object-cover max-h-80"
                  />
                ) : (
                  <div key={idx} className="relative w-full rounded-lg overflow-hidden" style={{ maxHeight: '20rem' }}>
                    <Image
                      src={resolveImageUrl(media.url) || ''}
                      alt=""
                      width={800}
                      height={450}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setPostImageViewerIndex(idx)
                        setPostImageViewerOpen(true)
                      }}
                    />
                  </div>
                )
              ))
            ) : (
              post.images?.map((image, idx) => (
                <div key={idx} className="relative w-full rounded-lg overflow-hidden" style={{ maxHeight: '20rem' }}>
                  <Image
                    src={resolveImageUrl(image) || ''}
                    alt=""
                    width={800}
                    height={450}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setPostImageViewerIndex(idx)
                      setPostImageViewerOpen(true)
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Event Reference — Rich-Preview wenn das Backend eventId populiert,
            sonst Fallback auf den mitgespeicherten eventTitle. */}
        {post.eventId && (() => {
          const populated = typeof post.eventId === 'object' ? post.eventId : null
          const eventRefId = populated?._id || (typeof post.eventId === 'string' ? post.eventId : '')
          if (!eventRefId) return null

          const eventName = populated?.name || post.eventTitle
          // Ohne Namen lässt sich kein Slug bilden — dann die rohe ID, die Route akzeptiert beides.
          const href = eventName ? `/event/${generateEventSlug(eventName, eventRefId)}` : `/event/${eventRefId}`
          const cover = populated?.locationImages?.[0]?.url

          return (
            <Link href={localePath(href)} onClick={e => e.stopPropagation()}>
              <div className="mt-2 mb-3 p-3 border rounded-xl flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer">
                {cover ? (
                  <img
                    src={resolveImageUrl(cover)}
                    alt=""
                    className="w-20 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {eventName || t('posts.eventFallback', { defaultValue: 'Event' })}
                  </p>
                  {populated?.eventDate && (
                    <p className="text-xs text-muted-foreground truncate">
                      📅 {new Date(populated.eventDate).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'de-AT')}
                      {populated.locationName && ` · 📍 ${populated.locationName.split(',')[0]}`}
                    </p>
                  )}
                </div>
                <span className="text-xs text-primary shrink-0">→</span>
              </div>
            </Link>
          )
        })()}

        {/* Reactions/Likes Summary + Comment Count Row (like Facebook/Mobile) */}
        {(() => {
          // Backend has TWO separate systems: likes[] and reactions[]
          // A user is in ONE of them (mutually exclusive), so total = likeCount + reactions.length
          const reactionsCount = post.reactions?.length || 0
          const likesCount = post.likeCount || 0
          const totalLikeReactionCount = likesCount + reactionsCount
          // Collect unique emojis from reactions array
          const uniqueEmojis: string[] = reactionsCount > 0
            ? [...new Set((post.reactions || []).map(r => String(r.emoji)))].slice(0, 3)
            : []
          const hasAny = totalLikeReactionCount > 0 || (post.commentCount || 0) > 0

          if (!hasAny) return null

          return (
            <div className="flex items-center justify-between pt-2 pb-1">
              {/* Left: Who reacted/liked - clickable */}
              {totalLikeReactionCount > 0 ? (
                <button
                  onClick={handleShowPostReactions}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  {/* Show heart icon for likes + emoji icons for reactions */}
                  <span className="flex">
                    {likesCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-sm">
                        <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                      </span>
                    )}
                    {uniqueEmojis.map((emoji, idx) => (
                      <span
                        key={emoji + idx}
                        className={cn(
                          'inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-sm',
                          (idx > 0 || likesCount > 0) && '-ml-1'
                        )}
                      >
                        {emoji}
                      </span>
                    ))}
                  </span>
                  <span className="text-sm">
                    {totalLikeReactionCount === 1
                      ? t('common.person')
                      : t('common.persons', { count: totalLikeReactionCount })}
                  </span>
                </button>
              ) : <span />}

              {/* Right: Comment count */}
              {(post.commentCount || 0) > 0 && (
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  {post.commentCount === 1 ? t('posts.oneComment') : t('posts.commentsCount', { count: post.commentCount })}
                </button>
              )}
            </div>
          )
        })()}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t mt-1">
          {/* Like/Reaction Button - tap to toggle 👍, emoji picker button next to it */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => requireAuth(handlePostLike)}
              disabled={postReactionMutation.isPending}
              className={cn(
                (getUserReaction(post.reactions || [], currentUserId) || post.hasLiked) && 'text-primary'
              )}
            >
              {getUserReaction(post.reactions || [], currentUserId) ? (
                <span className="text-lg mr-1">{getUserReaction(post.reactions || [], currentUserId)}</span>
              ) : post.hasLiked ? (
                <Heart className="h-4 w-4 mr-1 fill-current text-red-500" />
              ) : (
                <Heart className="h-4 w-4 mr-1" />
              )}
              {t('posts.like')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => requireAuth(openPostEmojiPicker)}
              title={t('posts.emojiReaction')}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.commentCount || 0}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Comment Input */}
            <div className="flex gap-2">
              <MentionInput
                value={commentText}
                onChangeText={setCommentText}
                onMentionsChange={setCommentMentions}
                placeholder={t('posts.writeComment')}
                className="text-sm"
                rows={1}
              />
              <Button
                size="sm"
                onClick={() => requireAuth(handleSubmitComment)}
                disabled={!commentText.trim() || commentMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map((comment, commentIndex) => {
                  const commentUser = getCommentUser(comment)
                  const commentUserId = commentUser._id || commentUser.id
                  return (
                  <div key={comment._id || commentIndex} className="space-y-2">
                    {/* Comment */}
                    <div className="flex gap-2">
                      <Link href={`/user/${commentUserId}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={resolveImageUrl(commentUser.profileImage)} />
                          <AvatarFallback className="text-xs">
                            {getInitials(commentUser.name || '')}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <Link
                            href={`/user/${commentUserId}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {commentUser.name || 'User'}
                          </Link>
                          <RenderTextWithMentions
                            text={comment.text || comment.content || ''}
                            mentions={comment.mentions}
                            mentionedUsers={comment.mentionedUsers}
                            onMentionPress={(userId) => router.push(`/user/${userId}`)}
                            className="text-sm block"
                          />
                        </div>

                        {/* Reaction Summary */}
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="mt-1">
                            <EmojiReactionDisplay
                              reactions={comment.reactions}
                              currentUserId={currentUserId}
                              onPress={() => handleShowCommentReactions(commentIndex)}
                              compact
                            />
                          </div>
                        )}

                        {/* Comment Actions */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatTime(comment.createdAt)}</span>
                          <button
                            onClick={() => requireAuth(() => {
                              // Like comment = toggle 👍 emoji reaction
                              commentReactionMutation.mutate({ commentIndex, emoji: DEFAULT_LIKE_EMOJI })
                            })}
                            className={cn(
                              'hover:text-foreground flex items-center gap-0.5',
                              getUserReaction(comment.reactions || [], currentUserId) === DEFAULT_LIKE_EMOJI && 'text-primary'
                            )}
                          >
                            <Heart className={cn(
                              'h-3.5 w-3.5',
                              getUserReaction(comment.reactions || [], currentUserId) === DEFAULT_LIKE_EMOJI && 'fill-current'
                            )} />
                            {t('posts.like')}
                          </button>
                          <button
                            onClick={() => requireAuth(() => openCommentEmojiPicker(commentIndex))}
                            className={cn(
                              'hover:text-foreground',
                              getUserReaction(comment.reactions || [], currentUserId) && getUserReaction(comment.reactions || [], currentUserId) !== DEFAULT_LIKE_EMOJI && 'text-primary'
                            )}
                          >
                            {getUserReaction(comment.reactions || [], currentUserId) && getUserReaction(comment.reactions || [], currentUserId) !== DEFAULT_LIKE_EMOJI
                              ? <span className="text-sm">{getUserReaction(comment.reactions || [], currentUserId)}</span>
                              : <Smile className="h-3.5 w-3.5" />
                            }
                          </button>
                          <button
                            onClick={() => requireAuth(() => {
                              if (replyingTo === commentIndex) {
                                setReplyingTo(null)
                                setReplyText('')
                              } else {
                                setReplyingTo(commentIndex)
                                const userName = commentUser.username || commentUser.name
                                setReplyText(`@${userName} `)
                              }
                            })}
                            className="hover:text-foreground"
                          >
                            {t('posts.reply')}
                          </button>
                          {(isOwnComment(comment) || isOwnPost) && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(commentIndex)}
                              className="hover:text-destructive text-destructive/70"
                            >
                              {t('common.delete')}
                            </button>
                          )}
                          {!isOwnComment(comment) && !isOwnPost && (
                            <button
                              onClick={() => {
                                setReportTarget({ type: 'comment', commentIndex })
                                setShowReportModal(true)
                              }}
                              className="hover:text-foreground"
                            >
                              {t('posts.report')}
                            </button>
                          )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === commentIndex && (
                          <div className="flex gap-2 mt-2">
                            <MentionInput
                              value={replyText}
                              onChangeText={setReplyText}
                              onMentionsChange={setReplyMentions}
                              placeholder={t('posts.writeReply')}
                              className="text-sm"
                              rows={1}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(commentIndex)}
                              disabled={!replyText.trim() || replyMutation.isPending}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-10 space-y-2">
                        {comment.replies.map((reply, replyIndex) => {
                          const replyUser = getReplyUser(reply)
                          const replyUserId = replyUser._id || replyUser.id
                          return (
                          <div key={replyIndex} className="flex gap-2">
                            <Link href={`/user/${replyUserId}`}>
                              <Avatar className="h-6 w-6">
                <AvatarImage src={resolveImageUrl(replyUser.profileImage)} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(replyUser.name || '')}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <Link
                                  href={`/user/${replyUserId}`}
                                  className="font-medium text-xs hover:underline"
                                >
                                  {replyUser.name || 'User'}
                                </Link>
                                <RenderTextWithMentions
                                  text={reply.text}
                                  mentions={reply.mentions}
                                  mentionedUsers={reply.mentionedUsers}
                                  onMentionPress={(userId) => router.push(`/user/${userId}`)}
                                  className="text-sm block"
                                />
                              </div>

                              {/* Reply Reaction Summary */}
                              {reply.reactions && reply.reactions.length > 0 && (
                                <div className="mt-1">
                                  <EmojiReactionDisplay
                                    reactions={reply.reactions}
                                    currentUserId={currentUserId}
                                    onPress={() => handleShowReplyReactions(commentIndex, replyIndex)}
                                    compact
                                  />
                                </div>
                              )}

                              {/* Reply Actions */}
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{formatTime(reply.createdAt)}</span>
                                <button
                                  onClick={() => requireAuth(() => {
                                    // Like reply = toggle 👍 emoji reaction
                                    replyReactionMutation.mutate({ commentIndex, replyIndex, emoji: DEFAULT_LIKE_EMOJI })
                                  })}
                                  className={cn(
                                    'hover:text-foreground flex items-center gap-0.5',
                                    getUserReaction(reply.reactions || [], currentUserId) === DEFAULT_LIKE_EMOJI && 'text-primary'
                                  )}
                                >
                                  <Heart className={cn(
                                    'h-3 w-3',
                                    getUserReaction(reply.reactions || [], currentUserId) === DEFAULT_LIKE_EMOJI && 'fill-current'
                                  )} />
                                  {t('posts.like')}
                                </button>
                                <button
                                  onClick={() => requireAuth(() => openReplyEmojiPicker(commentIndex, replyIndex))}
                                  className={cn(
                                    'hover:text-foreground',
                                    getUserReaction(reply.reactions || [], currentUserId) && getUserReaction(reply.reactions || [], currentUserId) !== DEFAULT_LIKE_EMOJI && 'text-primary'
                                  )}
                                >
                                  {getUserReaction(reply.reactions || [], currentUserId) && getUserReaction(reply.reactions || [], currentUserId) !== DEFAULT_LIKE_EMOJI
                                    ? <span className="text-sm">{getUserReaction(reply.reactions || [], currentUserId)}</span>
                                    : <Smile className="h-3 w-3" />
                                  }
                                </button>
                                <button
                                  onClick={() => requireAuth(() => {
                                    setReplyingTo(commentIndex)
                                    const userName = replyUser.username || replyUser.name
                                    setReplyText(`@${userName} `)
                                  })}
                                  className="hover:text-foreground"
                                >
                                  {t('posts.reply')}
                                </button>
                                {(isOwnReply(reply) || isOwnPost) && (
                                  <button
                                    onClick={() => deleteReplyMutation.mutate({ commentIndex, replyIndex })}
                                    className="hover:text-destructive text-destructive/70"
                                  >
                                    {t('common.delete')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                {t('posts.noCommentsBeFirst')}
              </p>
            )}
          </div>
        )}

        {/* Emoji Picker Modal */}
        <EmojiReactionPicker
          visible={showEmojiPicker}
          onClose={() => {
            setShowEmojiPicker(false)
            setReactionTarget(null)
          }}
          onSelectEmoji={handleEmojiSelect}
          currentUserReaction={getCurrentUserReaction()}
        />

        {/* Reactions Modal */}
        <ReactionsModal
          visible={showReactionsModal}
          onClose={() => setShowReactionsModal(false)}
          users={reactedUsers}
          isLoading={loadingReactions}
          onUserPress={(userId) => {
            setShowReactionsModal(false)
            router.push(`/user/${userId}`)
          }}
        />

        {/* Report Modal */}
        <ReportModal
          open={showReportModal}
          onClose={() => {
            setShowReportModal(false)
            setReportTarget(null)
          }}
          contentType={reportTarget?.type === 'comment' ? 'comment' : 'post'}
          postId={post._id}
          commentId={reportTarget?.commentIndex?.toString()}
        />

        {/* Post Images Viewer */}
        <ImageViewer
          images={
            post.media
              ? post.media.filter(m => m.type !== 'video').map(m => resolveImageUrl(m.url) || '')
              : (post.images || []).map(img => resolveImageUrl(img) || '')
          }
          initialIndex={postImageViewerIndex}
          isOpen={postImageViewerOpen}
          onClose={() => setPostImageViewerOpen(false)}
          alt="Post"
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <AlertDialogTitle>{t('posts.deleteConfirmTitle')}</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                {t('posts.deleteConfirmMessage')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={() => {
                  deleteMutation.mutate()
                  setShowDeleteDialog(false)
                }}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
