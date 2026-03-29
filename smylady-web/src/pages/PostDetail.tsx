import { useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, AlertCircle, MessageCircle, Heart, Smile, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { postsService, Comment, LikedByUser } from '@/services/posts'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, resolveImageUrl, cn } from '@/lib/utils'
import {
  EmojiReactionPicker,
  EmojiReactionDisplay,
  getUserReaction,
  ReactionsModal,
  DEFAULT_LIKE_EMOJI,
} from '@/components/emojiReaction/EmojiReactionPicker'
import MentionInput, { RenderTextWithMentions } from '@/components/mentionInput/MentionInput'

export default function PostDetail() {
  const { t, i18n } = useTranslation()
  const { postId } = useParams<{ postId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Comment state
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
  const reactionTargetRef = useRef<{
    type: 'post' | 'comment' | 'reply'
    commentIndex?: number
    replyIndex?: number
  } | null>(null)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [reactedUsers, setReactedUsers] = useState<LikedByUser[]>([])
  const [loadingReactions, setLoadingReactions] = useState(false)

  const currentUserId = user?.id || user?._id

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsService.getPost(postId!),
    enabled: !!postId,
  })

  // Helper: optimistically toggle a reaction in an array
  const toggleReactionOptimistic = (reactions: any[], emoji: string, userId: string) => {
    const existing = reactions.findIndex(
      (r: any) => (r.userId?.toString() === userId?.toString() || r.userId?._id?.toString() === userId?.toString()) && r.emoji === emoji
    )
    if (existing >= 0) {
      return reactions.filter((_: any, i: number) => i !== existing)
    }
    const filtered = reactions.filter(
      (r: any) => r.userId?.toString() !== userId?.toString() && r.userId?._id?.toString() !== userId?.toString()
    )
    return [...filtered, { userId, emoji, createdAt: new Date().toISOString() }]
  }

  // Post reaction mutation (emoji-based likes, like mobile app) with optimistic update
  const postReactionMutation = useMutation({
    mutationFn: (emoji: string) => postsService.togglePostReaction(post!._id, emoji),
    onMutate: async (emoji: string) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const previousPost = queryClient.getQueryData(['post', postId])
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old
        return { ...old, reactions: toggleReactionOptimistic(old.reactions || [], emoji, currentUserId!) }
      })
      return { previousPost }
    },
    onError: (_err, _emoji, context) => {
      if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  // Comment reaction mutation with optimistic update
  const commentReactionMutation = useMutation({
    mutationFn: ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) =>
      postsService.toggleCommentReaction(post!._id, commentIndex, emoji),
    onMutate: async ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const previousPost = queryClient.getQueryData(['post', postId])
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old
        const updatedComments = [...(old.comments || [])]
        if (updatedComments[commentIndex]) {
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            reactions: toggleReactionOptimistic(updatedComments[commentIndex].reactions || [], emoji, currentUserId!),
          }
        }
        return { ...old, comments: updatedComments }
      })
      return { previousPost }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  // Reply reaction mutation with optimistic update
  const replyReactionMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) =>
      postsService.toggleReplyReaction(post!._id, commentIndex, replyIndex, emoji),
    onMutate: async ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const previousPost = queryClient.getQueryData(['post', postId])
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old
        const updatedComments = [...(old.comments || [])]
        if (updatedComments[commentIndex]?.replies?.[replyIndex]) {
          const updatedReplies = [...updatedComments[commentIndex].replies]
          updatedReplies[replyIndex] = {
            ...updatedReplies[replyIndex],
            reactions: toggleReactionOptimistic(updatedReplies[replyIndex].reactions || [], emoji, currentUserId!),
          }
          updatedComments[commentIndex] = { ...updatedComments[commentIndex], replies: updatedReplies }
        }
        return { ...old, comments: updatedComments }
      })
      return { previousPost }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  // Comment mutation with optimistic update
  const commentMutation = useMutation({
    mutationFn: ({ content, mentions }: { content: string; mentions?: string[] }) =>
      postsService.addComment(post!._id, content, mentions),
    onMutate: async ({ content }: { content: string; mentions?: string[] }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const previousPost = queryClient.getQueryData(['post', postId])
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          comments: [...(old.comments || []), {
            _id: 'temp-' + Date.now(),
            text: content,
            userId: currentUserId,
            user: { _id: currentUserId, name: user?.name || user?.username || 'User', profileImage: user?.profileImage },
            createdAt: new Date().toISOString(),
            reactions: [],
            replies: [],
          }],
          commentCount: (old.commentCount || 0) + 1,
        }
      })
      return { previousPost }
    },
    onSuccess: () => {
      setCommentText('')
      setCommentMentions([])
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  // Reply mutation with optimistic update
  const replyMutation = useMutation({
    mutationFn: ({ commentIndex, text, mentions }: { commentIndex: number; text: string; mentions?: string[] }) =>
      postsService.addReply(post!._id, commentIndex, text, mentions),
    onMutate: async ({ commentIndex, text }: { commentIndex: number; text: string; mentions?: string[] }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })
      const previousPost = queryClient.getQueryData(['post', postId])
      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old
        const updatedComments = [...(old.comments || [])]
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
            }],
          }
        }
        return { ...old, comments: updatedComments }
      })
      return { previousPost }
    },
    onSuccess: () => {
      setReplyText('')
      setReplyMentions([])
      setReplyingTo(null)
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPost) queryClient.setQueryData(['post', postId], context.previousPost)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  // Handle post like (tap = toggle 👍, like mobile app)
  const handlePostLike = () => {
    if (!post) return
    const userReaction = getUserReaction(post.reactions || [], currentUserId)
    if (userReaction) {
      // User already has a reaction, remove it by toggling same emoji
      postReactionMutation.mutate(userReaction)
    } else if (post.hasLiked) {
      // User has a legacy like (not in reactions array), toggle it off via 👍
      postReactionMutation.mutate(DEFAULT_LIKE_EMOJI)
    } else {
      // Add default 👍 like
      postReactionMutation.mutate(DEFAULT_LIKE_EMOJI)
    }
  }

  // Handle post emoji reaction (from picker)
  const handlePostEmojiReaction = (emoji: string) => {
    postReactionMutation.mutate(emoji)
  }

  // Emoji handlers
  const handleEmojiSelect = (emoji: string) => {
    const target = reactionTargetRef.current
    if (!target) return

    if (target.type === 'post') {
      handlePostEmojiReaction(emoji)
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

  const openPostEmojiPicker = () => {
    const target = { type: 'post' as const }
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

  const getCurrentUserReaction = (): string | undefined => {
    if (!reactionTarget || !post) return undefined

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

  // Show who reacted on post
  const handleShowPostReactions = async () => {
    if (!post) return
    const reactionsCount = post.reactions?.length || 0
    const totalCount = (post.likeCount || 0) + reactionsCount
    if (totalCount === 0) return
    setShowReactionsModal(true)
    setLoadingReactions(true)
    try {
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

  const handleShowCommentReactions = async (commentIndex: number) => {
    if (!post) return
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
    if (!post) return
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

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/feed">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('postDetail.title', { defaultValue: 'Beitrag' })}
          </h1>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/feed">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('postDetail.title', { defaultValue: 'Beitrag' })}
          </h1>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {t('postDetail.notFound', { defaultValue: 'Beitrag nicht gefunden' })}
          </h2>
          <p className="text-muted-foreground">
            {t('postDetail.notFoundMessage', {
              defaultValue: 'Dieser Beitrag existiert nicht mehr oder wurde gelöscht.',
            })}
          </p>
        </div>
      </div>
    )
  }

  // Get post user info
  const postUser =
    (post as any).user ||
    (typeof post.userId === 'object' ? post.userId : null) ||
    { _id: post.userId, name: 'User', profileImage: undefined }
  const postUserId =
    postUser._id ||
    postUser.id ||
    (typeof post.userId === 'string' ? post.userId : (post.userId as any)?._id)

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/feed">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">
          {t('postDetail.title', { defaultValue: 'Beitrag' })}
        </h1>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Link to={`/user/${postUserId}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveImageUrl(postUser.profileImage)} />
                <AvatarFallback>{getInitials(postUser.name || '')}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/user/${postUserId}`} className="font-semibold hover:underline">
                {postUser.name || postUser.username || 'User'}
              </Link>
              <p className="text-xs text-muted-foreground">{formatTime(post.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <RenderTextWithMentions
            text={post.text || post.content || ''}
            mentions={post.mentions}
            mentionedUsers={post.mentionedUsers}
            onMentionPress={(userId) => navigate(`/user/${userId}`)}
            className="mb-4 whitespace-pre-wrap block"
          />

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4 rounded-lg overflow-hidden">
              {post.images.length === 1 ? (
                <img
                  src={resolveImageUrl(post.images[0])}
                  alt="Post"
                  className="w-full max-h-[500px] object-cover"
                />
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {post.images.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={resolveImageUrl(img)}
                      alt={`Post ${idx + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions/Likes Summary (like Feed.tsx) */}
          {(() => {
            const reactionsCount = post.reactions?.length || 0
            const likesCount = post.likeCount || 0
            const totalLikeReactionCount = likesCount + reactionsCount
            const uniqueEmojis: string[] = reactionsCount > 0
              ? [...new Set((post.reactions || []).map(r => String(r.emoji)))].slice(0, 3)
              : []

            if (totalLikeReactionCount === 0) return null

            return (
              <div className="flex items-center pt-2 pb-1">
                <button
                  onClick={handleShowPostReactions}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
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
                onClick={handlePostLike}
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
                onClick={openPostEmojiPicker}
                title={t('posts.emojiReaction')}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.comments?.length || 0}
            </Button>
          </div>

          {/* Comments Section */}
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
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || commentMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            {post.comments && post.comments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">{t('posts.comments')}</h3>
                {post.comments.map((comment, commentIndex) => {
                  const commentUser = getCommentUser(comment)
                  const commentUserId = commentUser._id || commentUser.id
                  return (
                    <div key={comment._id || commentIndex} className="space-y-2">
                      {/* Comment */}
                      <div className="flex gap-2">
                        <Link to={`/user/${commentUserId}`}>
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
                              to={`/user/${commentUserId}`}
                              className="font-medium text-sm hover:underline"
                            >
                              {commentUser.name || 'User'}
                            </Link>
                            <RenderTextWithMentions
                              text={comment.text || (comment as any).content || ''}
                              mentions={(comment as any).mentions}
                              mentionedUsers={(comment as any).mentionedUsers}
                              onMentionPress={(userId) => navigate(`/user/${userId}`)}
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
                              onClick={() => {
                                // Like comment = toggle 👍 emoji reaction
                                commentReactionMutation.mutate({ commentIndex, emoji: DEFAULT_LIKE_EMOJI })
                              }}
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
                              onClick={() => openCommentEmojiPicker(commentIndex)}
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
                              onClick={() => {
                                if (replyingTo === commentIndex) {
                                  setReplyingTo(null)
                                  setReplyText('')
                                } else {
                                  setReplyingTo(commentIndex)
                                  const userName = commentUser.username || commentUser.name
                                  setReplyText(`@${userName} `)
                                }
                              }}
                              className="hover:text-foreground"
                            >
                              {t('posts.reply')}
                            </button>
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
                      {(comment as any).replies && (comment as any).replies.length > 0 && (
                        <div className="ml-10 space-y-2">
                          {(comment as any).replies.map((reply: any, replyIndex: number) => {
                            const replyUser = getReplyUser(reply)
                            const replyUserId = replyUser._id || replyUser.id
                            return (
                              <div key={replyIndex} className="flex gap-2">
                                <Link to={`/user/${replyUserId}`}>
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
                                      to={`/user/${replyUserId}`}
                                      className="font-medium text-xs hover:underline"
                                    >
                                      {replyUser.name || 'User'}
                                    </Link>
                                    <RenderTextWithMentions
                                      text={reply.text}
                                      mentions={reply.mentions}
                                      mentionedUsers={reply.mentionedUsers}
                                      onMentionPress={(userId) => navigate(`/user/${userId}`)}
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
                                      onClick={() => {
                                        // Like reply = toggle 👍 emoji reaction
                                        replyReactionMutation.mutate({ commentIndex, replyIndex, emoji: DEFAULT_LIKE_EMOJI })
                                      }}
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
                                      onClick={() => openReplyEmojiPicker(commentIndex, replyIndex)}
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
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emoji Picker Modal */}
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

      {/* Reactions Modal */}
      <ReactionsModal
        visible={showReactionsModal}
        onClose={() => {
          setShowReactionsModal(false)
          setReactedUsers([])
        }}
        users={reactedUsers}
        isLoading={loadingReactions}
        onUserPress={(userId) => navigate(`/user/${userId}`)}
      />
    </div>
  )
}
