import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesService, UserStories, Story } from '@/services/stories'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Eye,
  Plus,
  Trash2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react'

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
    // Reset on src change
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
        // Conversion failed - image genuinely broken
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

interface StoriesBarProps {
  onStoryClick?: (userId: string, storyIndex?: number) => void
  currentUserId?: string
}

// Stories Bar Component (horizontal scrollable bar)
export function StoriesBar({ onStoryClick, currentUserId: _currentUserId }: StoriesBarProps) {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedUserIndex, setSelectedUserIndex] = useState(0)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')

  const currentUserId = user?._id || user?.id

  // Fetch stories feed (from followed users)
  const { data: feedStories = [], isLoading: loadingFeed } = useQuery({
    queryKey: ['storiesFeed'],
    queryFn: storiesService.getFeed,
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })

  // Fetch own stories separately (like mobile app does)
  const { data: myStories = [], isLoading: loadingMy } = useQuery<Story[]>({
    queryKey: ['myStories'],
    queryFn: storiesService.getMyStories,
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  })

  const isLoading = loadingFeed || loadingMy

  // Combine own stories with feed stories (like mobile app StoriesRow.tsx)
  const storiesFeed = useMemo(() => {
    console.log('[StoriesBar] Merging stories:', {
      feedStories: feedStories?.length || 0,
      myStories: myStories?.length || 0,
      currentUserId,
      isAuthenticated,
      loadingFeed,
      loadingMy,
    })

    const result: UserStories[] = []

    // Add own stories first (if any)
    if (myStories && myStories.length > 0 && currentUserId) {
      const ownEntry = {
        userId: currentUserId,
        userName: user?.name || user?.username || 'Du',
        userProfileImage: user?.profileImage || null,
        isOwnStory: true,
        stories: myStories,
        hasUnviewedStories: false, // Own stories are always "viewed"
      }
      console.log('[StoriesBar] Adding own stories entry:', ownEntry.stories.length, 'stories')
      result.push(ownEntry)
    }

    // Add feed stories, skip own user (already added above)
    if (feedStories) {
      feedStories.forEach((userStory) => {
        if (userStory.userId !== currentUserId) {
          result.push(userStory)
        }
      })
    }

    console.log('[StoriesBar] Final merged storiesFeed:', result.length, 'user groups')
    return result
  }, [feedStories, myStories, currentUserId, user?.name, user?.username, user?.profileImage])

  const createStoryMutation = useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      storiesService.createStory(file, caption),
    onSuccess: (data) => {
      console.log('[StoriesBar] Story created successfully:', data)
      console.log('[StoriesBar] Invalidating queries...')
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      toast({ title: 'Story erstellt!' })
    },
    onError: (error) => {
      console.error('[StoriesBar] Story creation failed:', error)
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('stories.createError'),
      })
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if it's an image (not video) - only crop images
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file)
        setSelectedImageUrl(imageUrl)
        setCropModalOpen(true)
      } else {
        // For videos, upload directly without cropping
        createStoryMutation.mutate({ file })
      }
    }
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    createStoryMutation.mutate({ file: croppedFile })
    // Clean up the object URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
  }

  const handleCropClose = () => {
    setCropModalOpen(false)
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
  }

  const handleStoryClick = (userIndex: number) => {
    if (onStoryClick) {
      const userStories = storiesFeed[userIndex]
      onStoryClick(userStories.userId)
    } else {
      setSelectedUserIndex(userIndex)
      setSelectedStoryIndex(0)
      setViewerOpen(true)
    }
  }

  if (!isAuthenticated) return null

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary/50 hover:border-primary transition-colors"
            disabled={createStoryMutation.isPending}
          >
            <Plus className="h-6 w-6 text-primary" />
          </button>
          <span className="text-xs text-muted-foreground">Deine Story</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Stories */}
        {isLoading ? (
          // Skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))
        ) : (
          storiesFeed.map((userStories, index) => (
            <div
              key={userStories.userId}
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              onClick={() => handleStoryClick(index)}
            >
              <div
                className={cn(
                  'p-0.5 rounded-full',
                  userStories.hasUnviewedStories
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
                    : 'bg-muted'
                )}
              >
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={resolveImageUrl(userStories.userProfileImage) || ''} />
                  <AvatarFallback>{getInitials(userStories.userName || '')}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-16">
                {userStories.isOwnStory ? 'Du' : (userStories.userName || '').split(' ')[0] || 'User'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && storiesFeed.length > 0 && (
        <StoryViewer
          userStories={storiesFeed}
          initialUserIndex={selectedUserIndex}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        imageUrl={selectedImageUrl}
        onClose={handleCropClose}
        onCropComplete={handleCropComplete}
        freeStyle={true}
        title="Story-Bild zuschneiden"
      />
    </>
  )
}

// Story Viewer Component (fullscreen modal)
interface StoryViewerProps {
  userStories: UserStories[]
  initialUserIndex: number
  initialStoryIndex: number
  onClose: () => void
}

function StoryViewer({
  userStories,
  initialUserIndex,
  initialStoryIndex,
  onClose,
}: StoryViewerProps) {
  const { t } = useTranslation()
  useAuth() // For authentication context
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentUser = userStories[currentUserIndex]
  const currentStory = currentUser?.stories[currentStoryIndex]
  const isOwnStory = currentUser?.isOwnStory

  // Mark story as viewed
  const viewMutation = useMutation({
    mutationFn: (storyId: string) => storiesService.viewStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
    },
  })

  // Like story
  const likeMutation = useMutation({
    mutationFn: (storyId: string) =>
      currentStory?.hasLiked
        ? storiesService.unlikeStory(storyId)
        : storiesService.likeStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
    },
  })

  // Delete story
  const deleteMutation = useMutation({
    mutationFn: (storyId: string) => storiesService.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storiesFeed'] })
      queryClient.invalidateQueries({ queryKey: ['myStories'] })
      toast({ title: t('stories.deleted') })
      goToNextStory()
    },
  })

  // Auto-progress timer
  useEffect(() => {
    if (!currentStory || isPaused) return

    // Mark as viewed
    if (!currentStory.hasViewed && !isOwnStory) {
      viewMutation.mutate(currentStory._id)
    }

    const duration = currentStory.mediaType === 'video' ? 15000 : 5000
    let elapsed = 0
    const interval = 50

    timerRef.current = setInterval(() => {
      elapsed += interval
      setProgress((elapsed / duration) * 100)

      if (elapsed >= duration) {
        goToNextStory()
      }
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentStory?._id, isPaused])

  const goToNextStory = () => {
    setProgress(0)
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else if (currentUserIndex < userStories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1)
      setCurrentStoryIndex(0)
    } else {
      onClose()
    }
  }

  const goToPrevStory = () => {
    setProgress(0)
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1)
      const prevUser = userStories[currentUserIndex - 1]
      setCurrentStoryIndex(prevUser.stories.length - 1)
    }
  }

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width / 3) {
      goToPrevStory()
    } else if (x > (width * 2) / 3) {
      goToNextStory()
    } else {
      setIsPaused(!isPaused)
    }
  }

  if (!currentStory || !currentUser) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Story Container */}
      <div
        className="relative w-full h-full max-w-md mx-auto flex flex-col"
        onClick={handleTap}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {currentUser.stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-75"
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
        <div className="absolute top-8 left-0 right-0 z-10 flex items-center gap-3 px-4">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={resolveImageUrl(currentUser?.userProfileImage) || ''} />
            <AvatarFallback>{getInitials(currentUser?.userName || '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{currentUser?.userName || 'User'}</p>
            <p className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(currentStory?.createdAt || new Date()), {
                addSuffix: true,
                locale: de,
              })}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => setIsPaused(!isPaused)} className="p-2 text-white">
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            {currentStory.mediaType === 'video' && (
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            )}
            {isOwnStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteMutation.mutate(currentStory._id)
                }}
                className="p-2 text-white"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="flex-1 flex items-center justify-center">
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="max-h-full w-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
            />
          ) : (
            <SmartImage
              src={currentStory.mediaUrl}
              className="max-h-full w-full object-contain"
              alt=""
            />
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <p className="text-white text-center text-sm bg-black/30 rounded-lg px-3 py-2">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 px-4">
          {/* Views */}
          {isOwnStory && (
            <div className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5" />
              <span className="text-sm">{currentStory.viewCount}</span>
            </div>
          )}

          {/* Likes */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              likeMutation.mutate(currentStory._id)
            }}
            className={cn(
              'flex items-center gap-2',
              currentStory.hasLiked ? 'text-red-500' : 'text-white'
            )}
          >
            <Heart className={cn('h-5 w-5', currentStory.hasLiked && 'fill-current')} />
            <span className="text-sm">{currentStory.likeCount}</span>
          </button>
        </div>

        {/* Navigation Arrows */}
        {currentUserIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrevStory()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        {(currentStoryIndex < currentUser.stories.length - 1 ||
          currentUserIndex < userStories.length - 1) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNextStory()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>
    </div>
  )
}

export default StoriesBar
