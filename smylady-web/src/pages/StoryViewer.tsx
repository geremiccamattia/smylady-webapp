import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Heart, Eye, Trash2, Send, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { storiesService, type Story, type UserStories } from '@/services/stories'
import { chatService } from '@/services/chat'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getInitials, resolveImageUrl } from '@/lib/utils'

const STORY_DURATION = 5000 // 5 seconds

/**
 * SmartImage component that handles HEIC/HEIF images transparently.
 * When a normal <img> fails to load (e.g. because it's HEIC from iPhone),
 * it fetches the blob and converts via heic2any.
 */
function SmartImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [displaySrc, setDisplaySrc] = useState<string | undefined>(src)
  const objectUrlRef = useRef<string | null>(null)
  const triedConversion = useRef(false)

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    triedConversion.current = false
    setDisplaySrc(src)
  }, [src])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleError = useCallback(() => {
    if (!src || triedConversion.current) return
    triedConversion.current = true

    ;(async () => {
      try {
        const response = await fetch(src)
        if (!response.ok) return

        const blob = await response.blob()
        const heic2any = (await import('heic2any')).default
        const converted = await heic2any({
          blob,
          toType: 'image/jpeg',
          quality: 0.85,
        })
        const resultBlob = Array.isArray(converted) ? converted[0] : converted
        const objectUrl = URL.createObjectURL(resultBlob)
        objectUrlRef.current = objectUrl
        setDisplaySrc(objectUrl)
      } catch {
        console.warn('SmartImage: HEIC conversion fallback failed for', src?.substring(0, 80))
      }
    })()
  }, [src])

  if (!displaySrc) return null

  return (
    <img
      src={displaySrc}
      alt={alt || ''}
      className={className}
      onError={handleError}
    />
  )
}

export default function StoryViewer() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { toast } = useToast()

  const initialUserIndex = parseInt(searchParams.get('userIndex') || '0', 10)
  const currentUserId = user?._id || user?.id || ''

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showViewers, setShowViewers] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)

  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Fetch feed stories (from followed users)
  const { data: feedStoriesData } = useQuery({
    queryKey: ['storiesFeed'],
    queryFn: storiesService.getStories,
  })

  // Fetch own stories separately (like mobile app)
  const { data: myStoriesData } = useQuery<Story[]>({
    queryKey: ['myStories'],
    queryFn: storiesService.getMyStories,
  })

  // Combine own stories with feed stories (like mobile app StoriesRow.tsx)
  const userStories: UserStories[] = useMemo(() => {
    const result: UserStories[] = []

    // Add own stories first (if any)
    if (myStoriesData && myStoriesData.length > 0 && currentUserId) {
      result.push({
        userId: currentUserId,
        userName: user?.name || user?.username || 'Du',
        userProfileImage: user?.profileImage || null,
        isOwnStory: true,
        stories: myStoriesData,
        hasUnviewedStories: false,
      })
    }

    // Add feed stories, skip own user (already added above)
    if (feedStoriesData) {
      feedStoriesData.forEach((userStory) => {
        if (userStory.userId !== currentUserId) {
          result.push(userStory)
        }
      })
    }

    return result
  }, [feedStoriesData, myStoriesData, currentUserId, user?.name, user?.username, user?.profileImage])
  const currentUserStories = userStories[currentUserIndex]
  const currentStory: Story | undefined = currentUserStories?.stories[currentStoryIndex]
  const isOwnStory = currentUserStories?.userId === currentUserId

  // Fetch viewers for own story
  const { data: viewersData } = useQuery({
    queryKey: ['storyViewers', currentStory?._id],
    queryFn: () => storiesService.getStoryViewers(currentStory!._id),
    enabled: !!currentStory?._id && isOwnStory && showViewers,
  })

  // Mark story as viewed
  const viewStoryMutation = useMutation({
    mutationFn: (storyId: string) => storiesService.viewStory(storyId),
  })

  // Like/unlike story
  const toggleLikeMutation = useMutation({
    mutationFn: (storyId: string) => storiesService.toggleLike(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
    },
  })

  // Delete story
  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: string) => storiesService.deleteStory(storyId),
    onSuccess: () => {
      toast({ description: t('story.deleted', { defaultValue: 'Story gelöscht' }) })
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      if (currentUserStories?.stories.length === 1) {
        handleClose()
      } else {
        goToNextStory()
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('story.deleteError', { defaultValue: 'Fehler beim Löschen' }),
      })
    },
  })

  // Send reply message
  const sendReplyMutation = useMutation({
    mutationFn: (message: string) =>
      chatService.sendMessage(
        currentUserStories!.userId,
        `📖 ${t('story.replyToStory', { defaultValue: 'Antwort auf Story' })}\n${message}`
      ),
    onSuccess: () => {
      toast({
        description: t('story.messageSent', { defaultValue: 'Nachricht gesendet' }),
      })
      setReplyText('')
      setShowReplyInput(false)
      handleClose()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('story.messageError', { defaultValue: 'Fehler beim Senden' }),
      })
    },
  })

  // Mark story as viewed when it changes
  useEffect(() => {
    if (currentStory && !isOwnStory) {
      viewStoryMutation.mutate(currentStory._id)
    }
  }, [currentStory?._id, isOwnStory])

  // Progress animation
  useEffect(() => {
    if (!currentStory || isPaused || showReplyInput) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
      return
    }

    // Skip auto-progress for videos (handled by video element)
    if (currentStory.mediaType === 'video') {
      return
    }

    setProgress(0)
    const startTime = Date.now()

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed / STORY_DURATION) * 100

      if (newProgress >= 100) {
        clearInterval(progressInterval.current!)
        goToNextStory()
      } else {
        setProgress(newProgress)
      }
    }, 50)

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [currentStory?._id, isPaused, showReplyInput, currentStoryIndex, currentUserIndex])

  const goToNextStory = useCallback(() => {
    if (!currentUserStories) return

    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1)
      setProgress(0)
    } else if (currentUserIndex < userStories.length - 1) {
      setCurrentUserIndex((prev) => prev + 1)
      setCurrentStoryIndex(0)
      setProgress(0)
    } else {
      handleClose()
    }
  }, [currentStoryIndex, currentUserIndex, currentUserStories, userStories.length])

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1)
      setProgress(0)
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1)
      const prevUserStories = userStories[currentUserIndex - 1]
      setCurrentStoryIndex(prevUserStories.stories.length - 1)
      setProgress(0)
    }
  }, [currentStoryIndex, currentUserIndex, userStories])

  const handleClose = () => {
    navigate(-1)
  }

  const handleVideoEnded = () => {
    goToNextStory()
  }

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration
      const currentTime = videoRef.current.currentTime
      if (duration) {
        setProgress((currentTime / duration) * 100)
      }
    }
  }

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: false,
        locale: i18n.language === 'de' ? de : enUS,
      })
    } catch {
      return ''
    }
  }

  if (!currentStory || !currentUserStories) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
        {currentUserStories.stories.map((story, index) => (
          <div key={story._id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width:
                  index < currentStoryIndex
                    ? '100%'
                    : index === currentStoryIndex
                      ? `${progress}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-20 px-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/user/${currentUserStories.userId}`)}
          className="flex items-center gap-3"
        >
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={resolveImageUrl(currentUserStories.userProfileImage)} />
            <AvatarFallback>{getInitials(currentUserStories.userName)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{currentUserStories.userName}</p>
            <p className="text-white/70 text-xs">{formatTime(currentStory.createdAt)}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {isOwnStory && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setShowViewers(!showViewers)}
              >
                <Eye className="h-5 w-5" />
                <span className="ml-1 text-sm">{currentStory.viewCount || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => deleteStoryMutation.mutate(currentStory._id)}
                disabled={deleteStoryMutation.isPending}
              >
                {deleteStoryMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div
        className="flex-1 flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {currentStory.mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="max-h-full max-w-full object-contain"
            autoPlay
            playsInline
            onEnded={handleVideoEnded}
            onTimeUpdate={handleVideoTimeUpdate}
          />
        ) : (
          <SmartImage
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {/* Navigation touch zones */}
        <div className="absolute inset-0 flex">
          <button className="flex-1" onClick={goToPrevStory} />
          <button className="flex-1" onClick={goToNextStory} />
        </div>

        {/* Navigation buttons */}
        {currentUserIndex > 0 || currentStoryIndex > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={goToPrevStory}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        ) : null}

        {currentUserIndex < userStories.length - 1 ||
        currentStoryIndex < currentUserStories.stories.length - 1 ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={goToNextStory}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        ) : null}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-24 left-4 right-4 z-10">
          <p className="text-white text-center text-shadow">{currentStory.caption}</p>
        </div>
      )}

      {/* Bottom actions (for other users' stories) */}
      {!isOwnStory && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          {showReplyInput ? (
            <div className="flex items-center gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('story.sendMessage', { defaultValue: 'Nachricht senden...' })}
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    sendReplyMutation.mutate(replyText.trim())
                  }
                }}
              />
              <Button
                size="icon"
                className="bg-pink-500 hover:bg-pink-600"
                onClick={() => replyText.trim() && sendReplyMutation.mutate(replyText.trim())}
                disabled={!replyText.trim() || sendReplyMutation.isPending}
              >
                {sendReplyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowReplyInput(true)}
                className="flex-1 border border-white/50 rounded-full py-2 px-4 text-white/70 text-left"
              >
                {t('story.sendMessage', { defaultValue: 'Nachricht senden...' })}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => toggleLikeMutation.mutate(currentStory._id)}
              >
                <Heart
                  className={`h-6 w-6 ${currentStory.hasLiked ? 'fill-pink-500 text-pink-500' : ''}`}
                />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Viewers modal */}
      {showViewers && isOwnStory && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[50vh] z-30">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">
              {t('story.viewers', { defaultValue: 'Zuschauer' })} ({viewersData?.length || 0})
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowViewers(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-[calc(50vh-60px)]">
            {viewersData && viewersData.length > 0 ? (
              viewersData.map((viewer: any) => (
                <div key={viewer._id} className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveImageUrl(viewer.profilePicture)} />
                    <AvatarFallback>{getInitials(viewer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{viewer.name || viewer.username}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(viewer.viewedAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('story.noViewers', { defaultValue: 'Noch keine Zuschauer' })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
