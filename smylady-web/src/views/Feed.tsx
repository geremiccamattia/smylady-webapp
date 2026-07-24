'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { postsService } from '@/services/posts'
import { useAuth } from '@/contexts/AuthContext'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { StoriesBar } from '@/components/stories/StoriesBar'
import CommunityExplore from '@/components/community/CommunityExplore'
import { PostCard } from '@/components/PostCard'
import MentionInput from '@/components/mentionInput/MentionInput'
import { SpotifyTrackSearch } from '@/components/SpotifyTrackSearch'
import { SpotifyTrackPreview } from '@/components/SpotifyTrackPreview'
import { SpotifyTrack } from '@/services/spotify'
import {
  MessageCircle,
  Image as ImageIcon,
  X,
  Loader2,
  Calendar,
  Music,
} from 'lucide-react'

function FeedContent() {
  const { user, isAuthenticated } = useAuth()
  const { requireAuth } = useRequireAuth()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'communities'>('feed')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'communities') {
      setActiveTab('communities')
    }
  }, [searchParams])

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      const timer = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
          }, 2000)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Fetch feed posts
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed', isAuthenticated],
    queryFn: ({ pageParam = 1 }) =>
      isAuthenticated
        ? postsService.getFeed(pageParam)
        : postsService.getPublicFeed(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })

  const posts = postsData?.pages.flatMap(page => page.posts) || []

  return (
    <div className={activeTab === 'feed' ? 'max-w-2xl mx-auto space-y-6' : 'space-y-6'}>
      {/* Feed / Communities Sub-Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('feed')}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors",
            activeTab === 'feed'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t('feed.feed', { defaultValue: 'Feed' })}
        </button>
        <button
          onClick={() => setActiveTab('communities')}
          className={cn(
            "flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors",
            activeTab === 'communities'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t('feed.communities', { defaultValue: 'Communities' })}
        </button>
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* Stories */}
          <Card>
            <CardContent className="p-4">
              <StoriesBar />
            </CardContent>
          </Card>

          {/* Create Post */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resolveImageUrl(user?.profileImage)} />
                  <AvatarFallback>{getInitials(user?.name || user?.username || '')}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => requireAuth(() => setShowCreatePost(true))}
                  className="flex-1 text-left px-4 py-2 bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {t('posts.whatsNew')}
                </button>
                <Button size="icon" variant="ghost" onClick={() => requireAuth(() => setShowCreatePost(true))}>
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded mt-1" />
                      </div>
                    </div>
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t('posts.noPosts')}</h3>
                <p className="text-muted-foreground">
                  {t('posts.followOthers')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post._id} id={`post-${post._id}`}>
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
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

          {/* Create Post Modal */}
          {showCreatePost && (
            <CreatePostModal onClose={() => setShowCreatePost(false)} />
          )}
        </>
      ) : (
        <CommunityExplore />
      )}
    </div>
  )
}

export default function Feed() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  )
}

// Create Post Modal
export function CreatePostModal({
  onClose,
  initialEventId,
  initialEventTitle,
  initialImages,
  initialText,
  communityId,
}: {
  onClose: () => void
  initialEventId?: string
  initialEventTitle?: string
  initialImages?: File[]
  initialText?: string
  communityId?: string
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [content, setContent] = useState(initialText ?? '')
  const [mentions, setMentions] = useState<string[]>([])
  const [images, setImages] = useState<File[]>(initialImages ?? [])
  const [eventId] = useState(initialEventId)
  const [eventTitle] = useState(initialEventTitle)
  const [previews, setPreviews] = useState<string[]>([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [showSongSearch, setShowSongSearch] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)

  const createMutation = useMutation({
    mutationFn: () => postsService.create({
      content,
      images,
      mentions: mentions.length > 0 ? mentions : undefined,
      eventId: eventId ?? undefined,
      eventTitle: eventTitle ?? undefined,
      spotifyTrack: selectedTrack ?? undefined,
      communityId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: ['communityPosts', communityId] })
      }
      toast({ title: t('posts.postCreated') })
      setSelectedTrack(null)
      onClose()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('posts.couldNotCreate'),
      })
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 4) {
      toast({
        variant: 'destructive',
        title: t('posts.maxImages'),
      })
      return
    }

    // Reset input
    if (e.target) {
      e.target.value = ''
    }

    // Queue files and start cropping first one
    if (files.length > 0) {
      setPendingFiles(files.slice(1)) // Queue remaining files
      const imageUrl = URL.createObjectURL(files[0])
      setSelectedImageUrl(imageUrl)
      setCropModalOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    // Add cropped image
    setImages(prev => [...prev, croppedFile])
    
    // Generate preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviews(prev => [...prev, reader.result as string])
    }
    reader.readAsDataURL(croppedFile)
    
    // Clean up current URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
    
    // Process next pending file
    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0]
      setPendingFiles(pendingFiles.slice(1))
      const imageUrl = URL.createObjectURL(nextFile)
      setSelectedImageUrl(imageUrl)
      // Keep modal open for next image
    } else {
      setCropModalOpen(false)
    }
  }

  const handleCropClose = () => {
    setCropModalOpen(false)
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
    setPendingFiles([])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  return (
    <>
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t('posts.createPost')}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={resolveImageUrl(user?.profileImage)} />
              <AvatarFallback>{getInitials(user?.name || user?.username || '')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user?.name || user?.username}</p>
              <p className="text-xs text-muted-foreground">
                {communityId ? t('community.postingInCommunity', { defaultValue: 'In Community posten' }) : t('common.public')}
              </p>
            </div>
          </div>

          <MentionInput
            value={content}
            onChangeText={setContent}
            onMentionsChange={setMentions}
            placeholder={t('posts.whatsNew')}
            className="w-full min-h-[100px]"
            rows={4}
            autoFocus
          />

          {eventTitle && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{eventTitle}</span>
            </div>
          )}

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt=""
                    className="rounded-lg w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Song Search */}
          {showSongSearch && (
            <div className="mt-4">
              <SpotifyTrackSearch
                onSelect={(track) => {
                  setSelectedTrack(track)
                  setShowSongSearch(false)
                }}
                onClose={() => setShowSongSearch(false)}
              />
            </div>
          )}

          {/* Selected Song Preview */}
          {selectedTrack && (
            <div className="mt-4 relative">
              <SpotifyTrackPreview track={selectedTrack} compact />
              <button
                className="absolute top-1 right-1 bg-background rounded-full p-0.5"
                onClick={() => setSelectedTrack(null)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <div className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </label>
              <button
                type="button"
                onClick={() => setShowSongSearch(!showSongSearch)}
                className={`p-2 rounded-lg transition-colors ${
                  showSongSearch ? 'text-[#1DB954] bg-[#1DB954]/10' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Music className="h-5 w-5" />
              </button>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!content.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Posten'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Image Crop Modal */}
    <ImageCropModal
      open={cropModalOpen}
      imageUrl={selectedImageUrl}
      onClose={handleCropClose}
      onCropComplete={handleCropComplete}
      freeStyle={true}
      title={t('posts.cropImage')}
    />
    </>
  )
}
