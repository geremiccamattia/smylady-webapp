import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { userService } from '@/services/user'
import { postsService, Post, Comment, LikedByUser } from '@/services/posts'
import { memoriesService } from '@/services/memories'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl, safeFormatDate, formatRelativeTime } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  EmojiReactionPicker,
  EmojiReactionDisplay,
  getUserReaction,
  ReactionsModal,
  Reaction,
  DEFAULT_LIKE_EMOJI,
} from '@/components/emojiReaction/EmojiReactionPicker'
import MentionInput, { RenderTextWithMentions, MentionUser } from '@/components/mentionInput/MentionInput'
import { ImageViewer } from '@/components/ImageViewer'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  X,

  UserPlus,
  UserMinus,
  MessageCircle,
  Heart,
  MoreHorizontal,
  Flag,
  Ban,
  Images,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  Search,

  Send,
  Smile,
  Settings,
  Image as ImageIcon,
  Trash2,
  Edit as EditIcon,
  Loader2,
  AlertTriangle,
  User,
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
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import ReportModal from '@/components/ReportModal'

// Memory type from profile data
interface ProfileMemory {
  url: string
  type?: 'image' | 'video'
  ticketId?: string
  memoryId?: string
  eventId?: string
  caption?: string
  likes?: string[]
  likeCount?: number
  comments?: any[]
  photoTags?: any[]
  uploadedBy?: any
  eventTitle?: string
  eventDate?: string
  uploadedAt?: string
  isHighlighted?: boolean
  reactions?: Array<{ emoji: string; userId: string; createdAt?: string }>
}

interface GroupedMemories {
  eventTitle: string
  eventDate: string
  eventId: string
  memories: ProfileMemory[]
}

type TabType = 'wall' | 'highlights' | 'memories'

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user: currentUser, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('wall')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [profileImageViewerOpen, setProfileImageViewerOpen] = useState(false)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [highlightSearchQuery, setHighlightSearchQuery] = useState('')
  const [selectedEventFilter, setSelectedEventFilter] = useState<string | null>(null)
  const [selectedMemory, setSelectedMemory] = useState<ProfileMemory | null>(null)
  const [selectedMemoryContext, setSelectedMemoryContext] = useState<{ memories: ProfileMemory[]; index: number }>({ memories: [], index: 0 })

  // Extract current user ID consistently
  const currentUserId = currentUser?.id || currentUser?._id

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
  })


  // Fetch user posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => postsService.getUserPosts(userId!, 1, 20),
    enabled: !!userId && activeTab === 'wall',
  })

  // Check if following - use currentUserId for consistent query key
  const { data: following } = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => userService.getFollowing(currentUserId!),
    enabled: !!currentUserId && isAuthenticated,
  })

  const isOwnProfile = currentUser && (currentUser.id === userId || currentUser._id === userId)

  // All memories from profile
  const allMemories: ProfileMemory[] = profile?.memories || []

  // Highlighted memories (for Highlights tab)
  const highlightedMemories = useMemo(() => {
    return allMemories.filter(m => m.isHighlighted)
  }, [allMemories])

  // Filtered highlights (search + event filter)
  const filteredHighlights = useMemo(() => {
    let filtered = [...highlightedMemories]

    if (highlightSearchQuery.trim()) {
      const query = highlightSearchQuery.toLowerCase()
      filtered = filtered.filter(
        m =>
          m.eventTitle?.toLowerCase().includes(query) ||
          m.caption?.toLowerCase().includes(query),
      )
    }

    if (selectedEventFilter) {
      filtered = filtered.filter(m => m.eventId === selectedEventFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0
      return dateB - dateA
    })

    return filtered
  }, [highlightedMemories, highlightSearchQuery, selectedEventFilter])

  // Unique events for filter chips in highlights
  const uniqueEvents = useMemo(() => {
    const eventMap = new Map<string, { eventId: string; eventTitle: string }>()
    highlightedMemories.forEach(m => {
      if (m.eventId && m.eventTitle && !eventMap.has(m.eventId)) {
        eventMap.set(m.eventId, { eventId: m.eventId, eventTitle: m.eventTitle })
      }
    })
    return Array.from(eventMap.values())
  }, [highlightedMemories])

  // Grouped memories by event (for Memories tab)
  const groupedMemories = useMemo<GroupedMemories[]>(() => {
    if (allMemories.length === 0) return []

    const grouped = allMemories.reduce(
      (acc: Record<string, GroupedMemories>, memory) => {
        const eventId = memory.eventId || 'no-event'
        if (!acc[eventId]) {
          acc[eventId] = {
            eventTitle: memory.eventTitle || 'Unbekanntes Event',
            eventDate: memory.eventDate || '',
            eventId: memory.eventId || '',
            memories: [],
          }
        }
        acc[eventId].memories.push(memory)
        return acc
      },
      {},
    )

    return Object.values(grouped).sort((a, b) => {
      if (!a.eventDate || !b.eventDate) return 0
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    })
  }, [allMemories])

  // Toggle event expansion in memories tab
  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  // Expand all events by default when switching to memories tab
  useEffect(() => {
    if (activeTab === 'memories' && expandedEvents.size === 0 && groupedMemories.length > 0) {
      setExpandedEvents(new Set(groupedMemories.map(g => g.eventId)))
    }
  }, [activeTab, groupedMemories])

  // Highlight toggle mutation
  const highlightMutation = useMutation({
    mutationFn: ({ ticketId, memoryId }: { ticketId: string; memoryId: string }) =>
      memoriesService.toggleHighlight(ticketId, memoryId),
    onMutate: async ({ ticketId, memoryId }) => {
      await queryClient.cancelQueries({ queryKey: ['userProfile', userId] })
      const previousProfile = queryClient.getQueryData(['userProfile', userId])

      queryClient.setQueryData(['userProfile', userId], (old: any) => {
        if (!old?.memories) return old
        return {
          ...old,
          memories: old.memories.map((m: ProfileMemory) =>
            m.ticketId === ticketId && m.memoryId === memoryId
              ? { ...m, isHighlighted: !m.isHighlighted }
              : m,
          ),
        }
      })

      return { previousProfile }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
      toast({ title: t('profile.highlightUpdated') })
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['userProfile', userId], context.previousProfile)
      }
      toast({ title: t('common.error'), description: t('profile.highlightError'), variant: 'destructive' })
    },
  })

  const handleToggleHighlight = (ticketId?: string, memoryId?: string) => {
    if (!ticketId || !memoryId) return
    highlightMutation.mutate({ ticketId, memoryId })
  }

  // Open memory in viewer
  const openMemoryViewer = (memory: ProfileMemory, contextMemories: ProfileMemory[], index: number) => {
    setSelectedMemory(memory)
    setSelectedMemoryContext({ memories: contextMemories, index })
  }

  // Check if the target user is in our following list (from server data)
  const isFollowingFromServer = following?.some(f => {
    const followedId = f._id || f.id
    return followedId === userId
  })

  // Local state for immediate UI updates - initialized from server data
  const [isFollowingLocal, setIsFollowingLocal] = useState<boolean | null>(null)

  // Sync local state with server data when it changes
  useEffect(() => {
    if (isFollowingFromServer !== undefined) {
      setIsFollowingLocal(isFollowingFromServer)
    }
  }, [isFollowingFromServer])

  // Use local state if set, otherwise fallback to server data
  const isFollowing = isFollowingLocal ?? isFollowingFromServer ?? false

  // Follow/Unfollow mutation - simple and direct
  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (shouldFollow) {
        return userService.followUser(userId!)
      } else {
        return userService.unfollowUser(userId!)
      }
    },
    onMutate: async (shouldFollow: boolean) => {
      // Immediately update local state for instant UI feedback
      setIsFollowingLocal(shouldFollow)
      return { previousState: !shouldFollow }
    },
    onError: (_err, _shouldFollow, context) => {
      // Rollback on error
      if (context?.previousState !== undefined) {
        setIsFollowingLocal(context.previousState)
      }
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('common.actionFailed'),
      })
    },
    onSuccess: (_data, shouldFollow) => {
      toast({
        title: shouldFollow ? t('profile.following') : t('profile.unfollowed'),
        description: shouldFollow
          ? t('profile.nowFollowing', { name: profile?.name })
          : t('profile.noLongerFollowing', { name: profile?.name }),
      })
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['following', currentUserId] })
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
    },
  })

  // Handler that toggles follow state
  const handleFollowToggle = () => {
    if (followMutation.isPending) return
    // Pass the desired new state (opposite of current)
    followMutation.mutate(!isFollowing)
  }

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: () => userService.blockUser(userId!),
    onSuccess: () => {
      toast({ title: t('profile.userBlocked') })
      navigate(-1)
    },
  })

  // Start chat
  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Navigate to chat - the chat page will handle creating the conversation
    navigate(`/chat?userId=${userId}`)
  }

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-xl" />
          <div className="flex items-center gap-4 mt-4">
            <div className="h-24 w-24 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">{t('profile.userNotFound')}</h2>
        <p className="text-muted-foreground mb-8">
          {t('profile.userNotFoundDesc')}
        </p>
        <Button onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </div>
    )
  }

  const posts = postsData?.posts || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div 
              className="cursor-pointer"
              onClick={() => profile.profileImage && setProfileImageViewerOpen(true)}
            >
              <Avatar className="h-32 w-32 border-4 border-primary/20 hover:opacity-90 transition-opacity">
                <AvatarImage src={resolveImageUrl(profile.profileImage)} alt={profile.name} />
                <AvatarFallback className="gradient-bg text-white text-4xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-muted-foreground">{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                {/* Show age only if user has enabled it */}
                {profile.age && profile.showAge !== false && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {profile.age} Jahre
                  </span>
                )}
                {/* Show location only if user has enabled it */}
                {profile.locationName && profile.showLocation !== false && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.locationName}
                  </span>
                )}
                {safeFormatDate(profile.createdAt, { month: 'long', year: 'numeric' }) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t('profile.memberSince', { date: safeFormatDate(profile.createdAt, { month: 'long', year: 'numeric' }) })}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-6 mt-4">
                <Link
                  to={`/user/${userId}/list?type=subscribers`}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-bold">{profile.subscriberCount || profile.followersCount || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.followers')}</p>
                </Link>
                <Link
                  to={`/user/${userId}/list?type=following`}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-bold">{profile.subscribedCount || profile.followingCount || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.following')}</p>
                </Link>
                <Link
                  to={`/user/${userId}/events`}
                  className="text-center hover:text-primary transition-colors"
                >
                  <p className="font-bold">{(profile.upcomingEvents?.length || 0) + (profile.pastEvents?.length || 0) || profile.eventCount || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('profile.events')}</p>
                </Link>
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="flex gap-2">
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      {t('profile.unfollow')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('profile.follow')}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleStartChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('chat.title')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      {t('posts.report')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => blockMutation.mutate()}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      {t('profile.block')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {isOwnProfile && (
              <div className="flex gap-2">
                <Link to="/profile">
                  <Button variant="outline">{t('profile.editProfile')}</Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon" title={t('settings.title')}>
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="wall" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Wall
          </TabsTrigger>
          <TabsTrigger value="highlights" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Highlights
          </TabsTrigger>
          <TabsTrigger value="memories" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Memories
          </TabsTrigger>
        </TabsList>

        {/* Wall Tab */}
        <TabsContent value="wall">
          {/* Create Post - only on own profile */}
          {isOwnProfile && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveImageUrl(currentUser?.profileImage)} />
                    <AvatarFallback>{getInitials(currentUser?.name || currentUser?.username || '')}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-left px-4 py-2 bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    {t('posts.whatsNew')}
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => setShowCreatePost(true)}>
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t('posts.noPosts')}</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? t('profile.noPostsOwn')
                    : t('profile.noPostsOther')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post._id} post={post} wallOwnerId={userId} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Highlights Tab */}
        <TabsContent value="highlights">
          {/* Search and Filters */}
          {highlightedMemories.length > 0 && (
            <div className="space-y-3 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('profile.searchHighlights')}
                  value={highlightSearchQuery}
                  onChange={(e) => setHighlightSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Event filter chips */}
              {uniqueEvents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedEventFilter(null)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-colors border',
                      !selectedEventFilter
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-muted hover:bg-muted/80'
                    )}
                  >
                    {t('common.all')}
                  </button>
                  {uniqueEvents.map(event => (
                    <button
                      key={event.eventId}
                      onClick={() => setSelectedEventFilter(event.eventId)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-colors border flex items-center gap-1.5',
                        selectedEventFilter === event.eventId
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-muted hover:bg-muted/80'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {event.eventTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Highlights Grid - 2 columns like mobile */}
          {filteredHighlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredHighlights.map((memory, index) => {
                const highlightIndex = highlightedMemories.findIndex(
                  m => m.memoryId === memory.memoryId && m.ticketId === memory.ticketId
                )
                return (
                  <div
                    key={memory.memoryId || index}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-muted"
                    onClick={() => openMemoryViewer(memory, highlightedMemories, highlightIndex >= 0 ? highlightIndex : index)}
                  >
                    {/* Image/Video */}
                    {memory.type === 'video' ? (
                      <div className="relative w-full h-full bg-black">
                        <video src={resolveImageUrl(memory.url)} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={resolveImageUrl(memory.url)}
                        alt={memory.caption || 'Highlight'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Memory' }}
                      />
                    )}

                    {/* Event Badge - top left */}
                    {memory.eventTitle && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 max-w-[calc(100%-16px)]">
                        <Calendar className="h-3 w-3 text-white flex-shrink-0" />
                        <span className="text-white text-xs truncate">{memory.eventTitle}</span>
                      </div>
                    )}

                    {/* Hover overlay with reaction + comment counts */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-white">
                        {memory.reactions && memory.reactions.length > 0 ? (
                          <span className="text-lg">{[...new Set(memory.reactions.map(r => r.emoji))][0] || '👍'}</span>
                        ) : (
                          <span className="text-lg">👍</span>
                        )}
                        <span>{memory.reactions?.length || memory.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <MessageCircle className="w-5 h-5" />
                        <span>{memory.comments?.length || 0}</span>
                      </div>
                    </div>

                    {/* Like Count badge - bottom right (always visible) */}
                    {((memory.reactions?.length || 0) > 0 || (memory.likeCount ?? 0) > 0) && (
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-white fill-white" />
                        <span className="text-white text-xs">{memory.reactions?.length || memory.likeCount}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">
                  {highlightSearchQuery || selectedEventFilter
                    ? t('profile.noHighlightsFound')
                    : t('profile.noHighlights')}
                </h3>
                <p className="text-muted-foreground">
                  {highlightSearchQuery || selectedEventFilter
                    ? t('profile.tryOtherFilters')
                    : isOwnProfile
                      ? t('profile.markFavoriteMemories')
                      : t('profile.noHighlightsDesc')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Memories Tab */}
        <TabsContent value="memories">
          {groupedMemories.length > 0 ? (
            <div className="space-y-4">
              {groupedMemories.map((eventGroup, eventIndex) => {
                const isExpanded = expandedEvents.has(eventGroup.eventId)

                return (
                  <Card key={eventGroup.eventId || eventIndex}>
                    {/* Event Group Header - Collapsible */}
                    <button
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                      onClick={() => toggleEventExpansion(eventGroup.eventId)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="text-left">
                          <h3 className="font-semibold text-sm truncate">{eventGroup.eventTitle}</h3>
                          {eventGroup.eventDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(eventGroup.eventDate).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm">
                          {eventGroup.memories.length} {eventGroup.memories.length === 1 ? 'Memory' : 'Memories'}
                        </span>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>

                    {/* Memories Grid - 3 columns like mobile */}
                    {isExpanded && (
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          {eventGroup.memories.map((memory, memoryIndex) => {
                            const originalIndex = allMemories.findIndex(
                              m => m.memoryId === memory.memoryId && m.ticketId === memory.ticketId
                            )

                            return (
                              <div
                                key={`${memory.memoryId}-${memoryIndex}`}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-muted"
                                onClick={() => openMemoryViewer(memory, allMemories, originalIndex >= 0 ? originalIndex : memoryIndex)}
                              >
                                {/* Image/Video */}
                                {memory.type === 'video' ? (
                                  <div className="relative w-full h-full bg-black">
                                    <video src={resolveImageUrl(memory.url)} className="w-full h-full object-cover" muted />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-black/50 rounded-full p-2">
                                        <Play className="w-6 h-6 text-white fill-white" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={resolveImageUrl(memory.url)}
                                    alt={memory.caption || 'Memory'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Memory' }}
                                  />
                                )}

                                {/* Highlight Star Toggle - only on own profile */}
                                {isOwnProfile && (
                                  <button
                                    className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1.5 hover:bg-black/70 transition-colors z-10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleHighlight(memory.ticketId, memory.memoryId)
                                    }}
                                    title={memory.isHighlighted ? t('profile.removeFromHighlights') : t('profile.addToHighlights')}
                                  >
                                    <Star
                                      className={cn(
                                        'h-5 w-5',
                                        memory.isHighlighted
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-white'
                                      )}
                                    />
                                  </button>
                                )}

                                {/* Hover overlay with reaction + comment counts */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none">
                                  <div className="flex items-center gap-1 text-white text-xs">
                                    {memory.reactions && memory.reactions.length > 0 ? (
                                      <span className="text-sm">{[...new Set(memory.reactions.map(r => r.emoji))][0] || '👍'}</span>
                                    ) : (
                                      <span className="text-sm">👍</span>
                                    )}
                                    <span>{memory.reactions?.length || memory.likeCount || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-white text-xs">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{memory.comments?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t('memories.noMemories')}</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? t('profile.noMemoriesOwn')
                    : t('profile.noMemoriesOther')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Profile Image Viewer */}
      {profile?.profileImage && (
        <ImageViewer
          images={[resolveImageUrl(profile.profileImage) || '']}
          isOpen={profileImageViewerOpen}
          onClose={() => setProfileImageViewerOpen(false)}
          alt={profile.name}
        />
      )}

      {/* Memory Detail Viewer */}
      {selectedMemory && (
        <ProfileMemoryViewer
          memory={selectedMemory}
          memories={selectedMemoryContext.memories}
          currentIndex={selectedMemoryContext.index}
          isOwnProfile={!!isOwnProfile}
          currentUserId={currentUserId}
          onClose={() => setSelectedMemory(null)}
          onToggleHighlight={handleToggleHighlight}
          onNavigate={(newIndex) => {
            const newMemory = selectedMemoryContext.memories[newIndex]
            if (newMemory) {
              setSelectedMemory(newMemory)
              setSelectedMemoryContext(prev => ({ ...prev, index: newIndex }))
            }
          }}
          onMemoryDataUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
          }}
        />
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['userPosts', userId] })
          }}
        />
      )}
    </div>
  )
}

// Post Card Component - full feature parity with Feed PostCard
function PostCard({ post, wallOwnerId }: { post: Post; wallOwnerId?: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()
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
  const reactionTargetRef = useRef<{
    type: 'post' | 'comment' | 'reply'
    commentIndex?: number
    replyIndex?: number
  } | null>(null)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [reactedUsers, setReactedUsers] = useState<LikedByUser[]>([])
  const [loadingReactions, setLoadingReactions] = useState(false)
  const [postImageViewerOpen, setPostImageViewerOpen] = useState(false)
  const [postImageViewerIndex, setPostImageViewerIndex] = useState(0)

  // Delete/Edit/Report state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment'
    commentIndex?: number
  } | null>(null)

  // Get post user info - backend returns user info in "user" field (populated),
  // fallback to "userId" if it's a populated object
  const postUser = (post as any).user || (typeof post.userId === 'object' ? post.userId : null) || { _id: post.userId, name: 'User', profileImage: undefined }
  const postUserId = postUser._id || postUser.id || (typeof post.userId === 'string' ? post.userId : (post.userId as any)?._id)

  const currentUserId = user?.id || user?._id

  // Robust ID comparison using toString() - like mobile app
  const isOwnPost = (() => {
    if (!user || !postUserId) return false
    const curId = (user.id || user._id)?.toString()
    const ownerId = postUserId?.toString()
    return curId === ownerId
  })()

  // Check if current user is the wall owner (profile owner can delete any comment on their wall)
  const isWallOwner = (() => {
    if (!currentUserId || !wallOwnerId) return false
    return currentUserId.toString() === wallOwnerId.toString()
  })()

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: () => postsService.delete(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast({ title: t('posts.deleted') })
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('common.error'), description: t('posts.deleteError') })
    },
  })

  // Post reaction mutation (emoji-based likes, like mobile app)
  const postReactionMutation = useMutation({
    mutationFn: (emoji: string) => postsService.togglePostReaction(post._id, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
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
      // Fetch both likes and reactions, combine them
      const [likeUsers, reactionUsers] = await Promise.all([
        postsService.getPostLikes(post._id),
        postsService.getPostReactions(post._id),
      ])
      // Merge: reactions have emoji, likes get a default heart
      const likeUsersWithEmoji = likeUsers.map(u => ({ ...u, emoji: u.emoji || '❤️' }))
      // Deduplicate by _id (a user can only be in one system)
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

  const commentMutation = useMutation({
    mutationFn: ({ content, mentions }: { content: string; mentions?: string[] }) =>
      postsService.addComment(post._id, content, mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      setCommentText('')
      setCommentMentions([])
      toast({ title: t('posts.commentAdded') })
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ commentIndex, text, mentions }: { commentIndex: number; text: string; mentions?: string[] }) =>
      postsService.addReply(post._id, commentIndex, text, mentions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      setReplyText('')
      setReplyMentions([])
      setReplyingTo(null)
      toast({ title: t('posts.replyAdded') })
    },
  })

  const commentReactionMutation = useMutation({
    mutationFn: ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) =>
      postsService.toggleCommentReaction(post._id, commentIndex, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
    },
  })

  const replyReactionMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) =>
      postsService.toggleReplyReaction(post._id, commentIndex, replyIndex, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
    },
  })

  // Delete comment mutation for posts
  const deleteCommentMutation = useMutation({
    mutationFn: (commentIndex: number) => postsService.deleteCommentByIndex(post._id, commentIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      toast({ title: t('posts.commentDeleted') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.commentDeleteError'), variant: 'destructive' })
    },
  })

  // Delete reply mutation for posts
  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex }: { commentIndex: number; replyIndex: number }) =>
      postsService.deleteReplyByIndex(post._id, commentIndex, replyIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      toast({ title: t('posts.replyDeleted') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.replyDeleteError'), variant: 'destructive' })
    },
  })

  // Check if comment belongs to current user
  const isOwnComment = (comment: Comment) => {
    if (!currentUserId) return false

    let commentUserId: string | undefined

    const commentUser = (comment as any).user
    if (commentUser && typeof commentUser === 'object') {
      commentUserId = commentUser._id || commentUser.id
    }

    if (!commentUserId) {
      if (typeof comment.userId === 'object' && comment.userId !== null) {
        commentUserId = (comment.userId as any)._id || (comment.userId as any).id
      } else if (typeof comment.userId === 'string') {
        commentUserId = comment.userId
      }
    }

    if (!commentUserId) return false
    return commentUserId.toString() === currentUserId.toString()
  }

  // Check if reply belongs to current user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwnReply = (reply: any) => {
    if (!currentUserId) return false

    let replyUserId: string | undefined

    const replyUser = reply.user
    if (replyUser && typeof replyUser === 'object') {
      replyUserId = replyUser._id || replyUser.id
    }

    if (!replyUserId) {
      if (typeof reply.userId === 'object' && reply.userId !== null) {
        replyUserId = reply.userId._id || reply.userId.id
      } else if (typeof reply.userId === 'string') {
        replyUserId = reply.userId
      }
    }

    if (!replyUserId) return false
    return replyUserId.toString() === currentUserId.toString()
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

  // Helper to get user info from comment/reply
  const getCommentUser = (comment: Comment) => {
    return (comment as any).user || (typeof comment.userId === 'object' ? comment.userId : null) || { _id: comment.userId, name: 'User', profileImage: undefined }
  }

  const getReplyUser = (reply: any) => {
    return reply.user || (typeof reply.userId === 'object' ? reply.userId : null) || { _id: reply.userId, name: 'User', profileImage: undefined }
  }

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: i18n.language === 'de' ? de : enUS })
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/user/${postUserId}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveImageUrl(postUser.profileImage)} />
                <AvatarFallback>{getInitials(postUser.name || '')}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                to={`/user/${postUserId}`}
                className="font-medium hover:underline"
              >
                {postUser.name || 'User'}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: i18n.language === 'de' ? de : enUS,
                })}
              </p>
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
                  <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                    <EditIcon className="h-4 w-4 mr-2" />
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
          onMentionPress={(uid) => navigate(`/user/${uid}`)}
          className="mb-4 whitespace-pre-wrap block"
        />

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
                    className="rounded-lg w-full object-cover max-h-64"
                  />
                ) : (
                  <img
                    key={idx}
                    src={resolveImageUrl(media.url)}
                    alt=""
                    className="rounded-lg w-full object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setPostImageViewerIndex(idx)
                      setPostImageViewerOpen(true)
                    }}
                  />
                )
              ))
            ) : (
              post.images?.map((image, idx) => (
                <img
                  key={idx}
                  src={resolveImageUrl(image)}
                  alt=""
                  className="rounded-lg w-full object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setPostImageViewerIndex(idx)
                    setPostImageViewerOpen(true)
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Event Reference */}
        {post.eventId && (
          <Link
            to={`/event/${post.eventId._id}`}
            className="block p-3 bg-muted rounded-lg mb-4 hover:bg-muted/80"
          >
            <div className="flex items-center gap-3">
              {post.eventId.thumbnailUrl && (
                <img
                  src={resolveImageUrl(post.eventId.thumbnailUrl)}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="font-medium">{post.eventId.name}</p>
                <p className="text-sm text-muted-foreground">{t('events.viewEvent')}</p>
              </div>
            </div>
          </Link>
        )}

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
                      ? t('posts.onePerson')
                      : t('posts.peopleCount', { count: totalLikeReactionCount })}
                  </span>
                </button>
              ) : <span />}

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
                onClick={handleSubmitComment}
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
                            text={comment.text || comment.content || ''}
                            mentions={comment.mentions}
                            mentionedUsers={comment.mentionedUsers}
                            onMentionPress={(uid) => navigate(`/user/${uid}`)}
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
                          {(isOwnComment(comment) || isOwnPost || isWallOwner) && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(commentIndex)}
                              className="hover:text-destructive text-destructive/70"
                            >
                              {t('common.delete')}
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
                                  onMentionPress={(uid) => navigate(`/user/${uid}`)}
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
                                <button
                                  onClick={() => {
                                    setReplyingTo(commentIndex)
                                    const userName = replyUser.username || replyUser.name
                                    setReplyText(`@${userName} `)
                                  }}
                                  className="hover:text-foreground"
                                >
                                  {t('posts.reply')}
                                </button>
                                {(isOwnReply(reply) || isOwnPost || isWallOwner) && (
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
            reactionTargetRef.current = null
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
          onUserPress={(uid) => {
            setShowReactionsModal(false)
            navigate(`/user/${uid}`)
          }}
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

        {/* Edit Post Modal */}
        {showEditModal && (
          <EditPostModal
            post={post}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['userPosts'] })
              queryClient.invalidateQueries({ queryKey: ['feed'] })
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

// Create Post Modal for UserProfile
function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const createMutation = useMutation({
    mutationFn: () => postsService.create({
      content,
      images,
      mentions: mentions.length > 0 ? mentions : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      onSuccess()
      toast({ title: t('posts.created') })
      onClose()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('posts.createError'),
      })
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 4) {
      toast({ variant: 'destructive', title: t('posts.maxImages') })
      return
    }
    if (e.target) e.target.value = ''
    if (files.length > 0) {
      setPendingFiles(files.slice(1))
      const imageUrl = URL.createObjectURL(files[0])
      setSelectedImageUrl(imageUrl)
      setCropModalOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    setImages(prev => [...prev, croppedFile])
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviews(prev => [...prev, reader.result as string])
    }
    reader.readAsDataURL(croppedFile)
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0]
      setPendingFiles(pendingFiles.slice(1))
      const imageUrl = URL.createObjectURL(nextFile)
      setSelectedImageUrl(imageUrl)
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
              <p className="text-xs text-muted-foreground">{t('posts.public')}</p>
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

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt="" className="rounded-lg w-full h-32 object-cover" />
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
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!content.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('posts.post')
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
      title={t('common.cropImage')}
    />
    </>
  )
}

// Edit Post Modal
function EditPostModal({ post, onClose, onSuccess }: { post: Post; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [text, setText] = useState(post.text || post.content || '')

  const updateMutation = useMutation({
    mutationFn: () => postsService.update(post._id, { text }),
    onSuccess: () => {
      onSuccess()
      toast({ title: t('posts.updated') })
      onClose()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('posts.updateError'),
      })
    },
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t('posts.editPost')}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <MentionInput
            value={text}
            onChangeText={setText}
            placeholder={t('posts.whatsNew')}
            className="w-full min-h-[100px]"
            rows={4}
            autoFocus
          />

          {/* Existing media preview (read-only) */}
          {((post.media && post.media.length > 0) || (post.images && post.images.length > 0)) && (
            <div className={cn(
              'grid gap-2 mt-4',
              (post.media?.length || post.images?.length || 0) === 1 ? 'grid-cols-1' : 'grid-cols-2'
            )}>
              {post.media ? (
                post.media.map((media, idx) => (
                  media.type === 'video' ? (
                    <video key={idx} src={resolveImageUrl(media.url)} controls className="rounded-lg w-full object-cover max-h-32" />
                  ) : (
                    <img key={idx} src={resolveImageUrl(media.url)} alt="" className="rounded-lg w-full object-cover max-h-32 opacity-70" />
                  )
                ))
              ) : (
                post.images?.map((image, idx) => (
                  <img key={idx} src={resolveImageUrl(image)} alt="" className="rounded-lg w-full object-cover max-h-32 opacity-70" />
                ))
              )}
            </div>
          )}

          <div className="flex justify-end mt-4 pt-4 border-t gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!text.trim() || text === (post.text || post.content || '') || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Profile Memory Viewer - split-panel detail view with comments & reactions (like mobile app)
function ProfileMemoryViewer({
  memory,
  memories,
  currentIndex,
  isOwnProfile,
  currentUserId,
  onClose,
  onToggleHighlight,
  onNavigate,
  onMemoryDataUpdate,
}: {
  memory: ProfileMemory
  memories: ProfileMemory[]
  currentIndex: number
  isOwnProfile: boolean
  currentUserId?: string
  onClose: () => void
  onToggleHighlight: (ticketId?: string, memoryId?: string) => void
  onNavigate: (newIndex: number) => void
  onMemoryDataUpdate?: () => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < memories.length - 1

  // Comment state
  const [comment, setComment] = useState('')
  const [commentMentions, setCommentMentions] = useState<string[]>([])
  const [showComments, setShowComments] = useState(true)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyMentions, setReplyMentions] = useState<string[]>([])
  const [replyInitialMentions, setReplyInitialMentions] = useState<MentionUser[]>([])

  // Emoji reaction state for memory
  const [showMemoryEmojiPicker, setShowMemoryEmojiPicker] = useState(false)

  // Emoji reaction state for comments
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [reactionTarget, setReactionTarget] = useState<{
    type: 'comment' | 'reply'
    commentIndex: number
    replyIndex?: number
  } | null>(null)
  const reactionTargetRef = useRef<{
    type: 'comment' | 'reply'
    commentIndex: number
    replyIndex?: number
  } | null>(null)

  // Reactions modal
  const [showReactionsModal, setShowReactionsModal] = useState(false)

  const ticketId = memory.ticketId || ''
  const memoryId = memory.memoryId || ''
  const hasApiIds = !!ticketId && !!memoryId

  // --- Local state for live memory data (populated from API mutation responses) ---
  // The profile API returns unpopulated data (userId as string, no profileImage/name).
  // The mutation APIs (addComment, toggleReaction, etc.) return a full Memory object
  // with populated user data. We store that here for instant UI updates.
  const [liveMemoryData, setLiveMemoryData] = useState<any>(null)

  // Fetch populated memory data on open via event memories (accessible to all users)
  const { data: fetchedMemory } = useQuery({
    queryKey: ['memoryDetail', memory.eventId, memoryId],
    queryFn: async () => {
      if (!memory.eventId) return null
      const eventMemories = await memoriesService.getEventMemories(memory.eventId)
      return eventMemories.find(m => (m.memoryId || m._id) === memoryId) || null
    },
    enabled: hasApiIds && !!memory.eventId,
    staleTime: 10000,
  })

  // Fetch event participants for mention linking in captions
  const { data: participants = [] } = useQuery({
    queryKey: ['eventParticipants', memory.eventId],
    queryFn: () => memoriesService.getEventParticipants(memory.eventId!),
    enabled: !!memory.eventId,
    staleTime: 60000,
  })

  // Use live data (from mutations) > fetched data (from query) > profile data (prop)
  const activeMemoryReactions = liveMemoryData?.reactions || fetchedMemory?.reactions || memory.reactions || []
  const activeComments = liveMemoryData?.comments || fetchedMemory?.comments || memory.comments || []
  const activeUploadedBy = liveMemoryData?.uploadedBy || fetchedMemory?.uploadedBy || memory.uploadedBy

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

    for (const commentItem of activeComments) {
      for (const mentionId of commentItem?.mentions || []) {
        addMentionId(mentionId as string | { _id?: string; id?: string })
      }

      for (const reply of commentItem?.replies || []) {
        for (const mentionId of reply?.mentions || []) {
          addMentionId(mentionId as string | { _id?: string; id?: string })
        }
      }
    }

    return [...ids]
  }, [activeComments])

  const resolvedMentionQueries = useQueries({
    queries: mentionedUserIds.map((mentionUserId) => ({
      queryKey: ['profileMemoryMentionUser', mentionUserId],
      queryFn: () => userService.getUserById(mentionUserId),
      enabled: !!mentionUserId,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const resolvedMentionUsers = useMemo(() => {
    return resolvedMentionQueries
      .map((query) => query.data)
      .filter((resolvedUser): resolvedUser is NonNullable<typeof resolvedUser> => !!resolvedUser)
      .map((resolvedUser) => ({
        _id: resolvedUser._id || resolvedUser.id,
        name: resolvedUser.name,
        username: resolvedUser.username,
      }))
  }, [resolvedMentionQueries])

  // Compute user's reaction on this memory
  const userReaction = getUserReaction(activeMemoryReactions as Reaction[] || [], currentUserId)
  const reactionCount = activeMemoryReactions.length || memory.likeCount || 0

  // Get unique emojis for reaction summary
  const getUniqueEmojis = (): string[] => {
    const emojis: string[] = activeMemoryReactions.map((r: any) => String(r.emoji))
    return Array.from(new Set(emojis)).slice(0, 3)
  }

  // Extract unique user IDs from reactions for profile lookup
  const reactionUserIds = useMemo(() => {
    const ids = activeMemoryReactions.map((r: any) => {
      return typeof r.userId === 'object' ? (r.userId?._id || r.userId?.id) : r.userId
    }).filter(Boolean)
    return Array.from(new Set(ids as string[]))
  }, [activeMemoryReactions])

  // Fetch user profiles for reaction users - only when modal is opened
  const { data: resolvedReactionUsers, isLoading: isLoadingReactionUsers } = useQuery({
    queryKey: ['reactionUsers', memoryId, ...reactionUserIds],
    queryFn: async () => {
      const profiles = await Promise.allSettled(
        reactionUserIds.map(id => userService.getUserById(id))
      )
      const userMap: Record<string, { _id: string; name: string; username?: string; profileImage?: string }> = {}
      profiles.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          const p = result.value
          userMap[reactionUserIds[idx]] = {
            _id: p._id || p.id || reactionUserIds[idx],
            name: p.name || p.username || 'User',
            username: p.username,
            profileImage: p.profileImage,
          }
        }
      })
      return userMap
    },
    enabled: showReactionsModal && reactionUserIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  })

  // Build users array for ReactionsModal with resolved profile data
  const reactionUsers = useMemo(() => {
    return activeMemoryReactions.map((r: any) => {
      const rawId = typeof r.userId === 'object' ? (r.userId?._id || r.userId?.id) : r.userId
      const userId = String(rawId || '')
      const resolved = resolvedReactionUsers?.[userId]
      // If userId is already populated object, use that data directly
      const populatedUser = typeof r.userId === 'object' ? r.userId : null
      return {
        _id: userId,
        name: resolved?.name || populatedUser?.name || populatedUser?.username || `User #${userId.slice(-4)}`,
        username: resolved?.username || populatedUser?.username,
        profileImage: resolved?.profileImage || populatedUser?.profileImage,
        emoji: r.emoji,
      }
    })
  }, [activeMemoryReactions, resolvedReactionUsers])

  // Uploader info - use populated data when available
  const uploaderInfo = activeUploadedBy
    ? (typeof activeUploadedBy === 'object'
      ? activeUploadedBy
      : { _id: activeUploadedBy, name: 'User' })
    : null

  // Reset comment state AND live data when navigating to a different memory
  useEffect(() => {
    setComment('')
    setCommentMentions([])
    setReplyingTo(null)
    setReplyText('')
    setReplyMentions([])
    setReplyInitialMentions([])
    setShowMemoryEmojiPicker(false)
    setShowEmojiPicker(false)
    setReactionTarget(null)
    reactionTargetRef.current = null
    setLiveMemoryData(null)
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, hasPrev, hasNext])

  // Helper: update live data from mutation response and also refresh background queries
  const handleMutationSuccess = (data: any) => {
    // The mutation response is a full Memory object with populated user data
    if (data && (data.comments || data.reactions)) {
      setLiveMemoryData(data)
    }
    queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    queryClient.invalidateQueries({ queryKey: ['memoryDetail', memory.eventId, memoryId] })
    onMemoryDataUpdate?.()
  }

  // --- Mutations ---

  // Memory-level reaction
  const memoryReactionMutation = useMutation({
    mutationFn: ({ emoji }: { emoji: string }) =>
      memoriesService.toggleReaction(ticketId, memoryId, emoji),
    onSuccess: (data) => {
      handleMutationSuccess(data)
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.reactionError'), variant: 'destructive' })
    },
  })

  // Add comment
  const commentMutation = useMutation({
    mutationFn: ({ text, mentions }: { text: string; mentions?: string[] }) =>
      memoriesService.addComment(ticketId, memoryId, text, mentions),
    onSuccess: (data) => {
      handleMutationSuccess(data)
      setComment('')
      setCommentMentions([])
      toast({ title: t('posts.commentAdded') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.commentAddError'), variant: 'destructive' })
    },
  })

  // Add reply
  const replyMutation = useMutation({
    mutationFn: ({ commentIndex, text, mentions }: { commentIndex: number; text: string; mentions?: string[] }) =>
      memoriesService.addReply(ticketId, memoryId, commentIndex, text, mentions),
    onSuccess: (data) => {
      handleMutationSuccess(data)
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

  // Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentIndex }: { commentIndex: number }) =>
      memoriesService.deleteComment(ticketId, memoryId, commentIndex),
    onSuccess: () => {
      // deleteComment returns void, so refetch event memories to get fresh data
      queryClient.invalidateQueries({ queryKey: ['memoryDetail', memory.eventId, memoryId] })
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      onMemoryDataUpdate?.()
      // Clear live data so it falls back to refetched query data
      setLiveMemoryData(null)
      toast({ title: t('posts.commentDeleted') })
    },
  })

  // Delete reply
  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex }: { commentIndex: number; replyIndex: number }) =>
      memoriesService.deleteReply(ticketId, memoryId, commentIndex, replyIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memoryDetail', memory.eventId, memoryId] })
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      onMemoryDataUpdate?.()
      setLiveMemoryData(null)
      toast({ title: t('posts.replyDeleted') })
    },
  })

  // Comment reaction - NOT using handleMutationSuccess because the API returns
  // { reacted, reactions } (comment-level reactions), NOT a full Memory object.
  // Using handleMutationSuccess would overwrite memory-level reactions with comment reactions.
  const commentReactionMutation = useMutation({
    mutationFn: ({ commentIndex, emoji }: { commentIndex: number; emoji: string }) =>
      memoriesService.toggleCommentReaction(ticketId, memoryId, commentIndex, emoji),
    onSuccess: (data, variables) => {
      // Update only the affected comment's reactions in liveMemoryData
      if (data?.reactions) {
        setLiveMemoryData((prev: any) => {
          const base = prev || fetchedMemory || memory
          const updatedComments = (base.comments || []).map((c: any, idx: number) => {
            if (idx === variables.commentIndex) {
              return { ...c, reactions: data.reactions }
            }
            return c
          })
          return { ...base, comments: updatedComments }
        })
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['memoryDetail', memory.eventId, memoryId] })
      onMemoryDataUpdate?.()
    },
  })

  // Reply reaction - same pattern: only update the affected reply's reactions
  const replyReactionMutation = useMutation({
    mutationFn: ({ commentIndex, replyIndex, emoji }: { commentIndex: number; replyIndex: number; emoji: string }) =>
      memoriesService.toggleReplyReaction(ticketId, memoryId, commentIndex, replyIndex, emoji),
    onSuccess: (data, variables) => {
      // Update only the affected reply's reactions in liveMemoryData
      if (data?.reactions) {
        setLiveMemoryData((prev: any) => {
          const base = prev || fetchedMemory || memory
          const updatedComments = (base.comments || []).map((c: any, cIdx: number) => {
            if (cIdx === variables.commentIndex && c.replies) {
              const updatedReplies = c.replies.map((r: any, rIdx: number) => {
                if (rIdx === variables.replyIndex) {
                  return { ...r, reactions: data.reactions }
                }
                return r
              })
              return { ...c, replies: updatedReplies }
            }
            return c
          })
          return { ...base, comments: updatedComments }
        })
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['memoryDetail', memory.eventId, memoryId] })
      onMemoryDataUpdate?.()
    },
  })

  // --- Handlers ---

  const handleMemoryReactionClick = () => {
    if (!hasApiIds) return
    if (userReaction) {
      memoryReactionMutation.mutate({ emoji: userReaction })
    } else {
      memoryReactionMutation.mutate({ emoji: DEFAULT_LIKE_EMOJI })
    }
  }

  const handleMemoryReactionLongPress = () => {
    if (!hasApiIds) return
    setShowMemoryEmojiPicker(true)
  }

  const handleMemoryEmojiSelect = (emoji: string) => {
    memoryReactionMutation.mutate({ emoji })
    setShowMemoryEmojiPicker(false)
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !hasApiIds) return
    commentMutation.mutate({
      text: comment,
      mentions: commentMentions.length > 0 ? commentMentions : undefined,
    })
  }

  const handleSubmitReply = (e: React.FormEvent, commentIndex: number) => {
    e.preventDefault()
    if (!replyText.trim() || !hasApiIds) return
    replyMutation.mutate({
      commentIndex,
      text: replyText,
      mentions: replyMentions.length > 0 ? replyMentions : undefined,
    })
  }

  const handleReplyClick = (
    commentIndex: number,
    commentUser: { _id?: string; name?: string; username?: string; profileImage?: string }
  ) => {
    if (replyingTo === commentIndex) {
      setReplyingTo(null)
      setReplyText('')
      setReplyInitialMentions([])
    } else {
      setReplyingTo(commentIndex)
      const userName = commentUser.username || commentUser.name || 'User'
      setReplyText(`@${userName} `)
      setReplyInitialMentions([{
        id: commentUser._id || '',
        name: commentUser.name || 'User',
        username: commentUser.username,
        profileImage: commentUser.profileImage,
      }])
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const target = reactionTargetRef.current
    if (!target) return
    if (target.type === 'comment') {
      commentReactionMutation.mutate({ commentIndex: target.commentIndex, emoji })
    } else if (target.replyIndex !== undefined) {
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
    if (!reactionTarget) return undefined
    if (reactionTarget.type === 'comment') {
      const reactions = (activeComments as any[])[reactionTarget.commentIndex]?.reactions || []
      return getUserReaction(reactions as Reaction[], currentUserId)
    }
    if (reactionTarget.replyIndex !== undefined) {
      const reactions = (activeComments as any[])[reactionTarget.commentIndex]?.replies?.[reactionTarget.replyIndex]?.reactions || []
      return getUserReaction(reactions as Reaction[], currentUserId)
    }
    return undefined
  }

  const isOwnComment = (commentUserId: string) => {
    if (!currentUserId) return false
    // Use .toString() for robust ID comparison (MongoDB ObjectID vs String)
    return commentUserId?.toString() === currentUserId?.toString()
  }

  const comments = activeComments as any[]

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex" onClick={onClose}>
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 left-4 z-[60] bg-black/50 hover:bg-black/70 rounded-full p-2 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] bg-black/50 hover:bg-black/70 rounded-full p-3 text-white transition-colors hidden md:flex"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          className="absolute right-[420px] top-1/2 -translate-y-1/2 z-[60] bg-black/50 hover:bg-black/70 rounded-full p-3 text-white transition-colors rotate-180 hidden md:flex"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Media Section */}
      <div className="flex-1 flex items-center justify-center p-4 relative min-h-0" onClick={(e) => e.stopPropagation()}>
        {memory.type === 'video' ? (
          <video
            src={resolveImageUrl(memory.url)}
            controls
            autoPlay
            className="max-w-full max-h-[calc(100vh-2rem)] rounded-lg"
          />
        ) : (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={resolveImageUrl(memory.url)}
              alt={memory.caption || 'Memory'}
              className="max-w-full max-h-[calc(100vh-2rem)] object-contain rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Memory' }}
            />
            {/* Photo Tags - clickable to navigate to user profile */}
            {memory.photoTags && memory.photoTags.length > 0 && memory.photoTags.map((tag: { userId: string | { _id: string; name: string }; user?: { _id: string; name: string }; x: number; y: number }, index: number) => {
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
              )
            })}
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {memories.length}
        </div>

        {/* Mobile navigation buttons */}
        <div className="flex md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 gap-4">
          {hasPrev && (
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              className="bg-black/50 hover:bg-black/70 rounded-full p-2 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              className="bg-black/50 hover:bg-black/70 rounded-full p-2 text-white rotate-180"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Sidebar with comments & reactions */}
      <div className="w-full max-w-md bg-background flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          {uploaderInfo && (
            <>
              <Avatar
                className="cursor-pointer"
                onClick={() => uploaderInfo._id && navigate(`/user/${uploaderInfo._id}`)}
              >
                <AvatarImage src={resolveImageUrl(uploaderInfo.profileImage)} />
                <AvatarFallback>{getInitials(uploaderInfo.name || '')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p
                  className="font-medium cursor-pointer hover:underline text-sm"
                  onClick={() => uploaderInfo._id && navigate(`/user/${uploaderInfo._id}`)}
                >
                  {uploaderInfo.name}
                </p>
                {memory.uploadedAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(memory.uploadedAt)}
                  </p>
                )}
              </div>
            </>
          )}
          <div className="flex items-center gap-1">
            {/* Highlight button */}
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleHighlight(memory.ticketId, memory.memoryId)}
                title={memory.isHighlighted ? t('profile.removeFromHighlights') : t('profile.addToHighlights')}
              >
                <Star className={cn('w-5 h-5', memory.isHighlighted && 'fill-yellow-400 text-yellow-400')} />
              </Button>
            )}
          </div>
        </div>

        {/* Caption & Event Info */}
        {(memory.caption || memory.eventTitle) && (
          <div className="p-4 border-b space-y-1">
            {memory.eventTitle && (
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => memory.eventId && navigate(`/event/${memory.eventId}`)}
              >
                <Calendar className="h-3.5 w-3.5" />
                {memory.eventTitle}
              </button>
            )}
            {memory.caption && (
              <RenderTextWithMentions
                text={memory.caption}
                participants={participants}
                onMentionPress={(userId) => navigate(`/user/${userId}`)}
                className="text-sm"
              />
            )}
          </div>
        )}

        {/* Reactions Section */}
        {hasApiIds && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-4">
              {/* Reaction button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMemoryReactionClick}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleMemoryReactionLongPress()
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
                  onClick={() => setShowMemoryEmojiPicker(true)}
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
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{comments.length}</span>
                {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {showComments && hasApiIds && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                {t('posts.noComments')}
              </p>
            )}
            {comments.map((commentItem: any, index: number) => {
              const commentUser = commentItem.userId && typeof commentItem.userId === 'object'
                ? commentItem.userId
                : commentItem.user || { _id: commentItem.userId, name: 'User' }
              const commentUserId = commentUser?._id || commentUser?.id || ''

              return (
                <div key={index} className="space-y-2">
                  {/* Comment */}
                  <div className="flex gap-2">
                    <Avatar
                      className="w-8 h-8 cursor-pointer flex-shrink-0"
                      onClick={() => commentUserId && navigate(`/user/${commentUserId}`)}
                    >
                      <AvatarImage src={resolveImageUrl(commentUser?.profileImage)} />
                      <AvatarFallback className="text-xs">
                        {getInitials(commentUser?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <p
                          className="font-medium text-sm cursor-pointer hover:underline"
                          onClick={() => commentUserId && navigate(`/user/${commentUserId}`)}
                        >
                          {commentUser?.name || 'User'}
                        </p>
                        <RenderTextWithMentions
                          text={commentItem.text || ''}
                          mentionedUsers={commentItem.mentionedUsers}
                          mentions={commentItem.mentions as any}
                          participants={participants}
                          resolvedMentionUsers={resolvedMentionUsers}
                          onMentionPress={(uid) => navigate(`/user/${uid}`)}
                          className="text-sm"
                        />
                      </div>

                      {/* Reaction Summary */}
                      {commentItem.reactions && commentItem.reactions.length > 0 && (
                        <div className="mt-1">
                          <EmojiReactionDisplay
                            reactions={commentItem.reactions as Reaction[]}
                            currentUserId={currentUserId}
                            onPress={() => {}}
                            compact
                          />
                        </div>
                      )}

                      {/* Comment Actions */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{commentItem.createdAt ? formatRelativeTime(commentItem.createdAt) : ''}</span>
                        <button
                          onClick={() => openCommentEmojiPicker(index)}
                          className={cn(
                            'hover:text-foreground',
                            getUserReaction(commentItem.reactions as Reaction[] || [], currentUserId) && 'text-primary'
                          )}
                        >
                          <Smile className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleReplyClick(index, commentUser)}
                          className="hover:text-foreground"
                        >
                          {t('posts.reply')}
                        </button>
                        {(isOwnProfile || (commentUserId && isOwnComment(commentUserId))) && (
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
                      {commentItem.replies.map((reply: any, replyIndex: number) => {
                        const replyUser = reply.userId && typeof reply.userId === 'object'
                          ? reply.userId
                          : reply.user || { _id: reply.userId, name: 'User' }
                        const replyUserId = replyUser?._id || replyUser?.id || ''

                        return (
                          <div key={replyIndex} className="flex gap-2">
                            <Avatar
                              className="w-6 h-6 cursor-pointer flex-shrink-0"
                              onClick={() => replyUserId && navigate(`/user/${replyUserId}`)}
                            >
                              <AvatarImage src={resolveImageUrl(replyUser?.profileImage)} />
                              <AvatarFallback className="text-xs">
                                {getInitials(replyUser?.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <p
                                  className="font-medium text-xs cursor-pointer hover:underline"
                                  onClick={() => replyUserId && navigate(`/user/${replyUserId}`)}
                                >
                                  {replyUser?.name || 'User'}
                                </p>
                                <RenderTextWithMentions
                                  text={reply.text || ''}
                                  mentionedUsers={reply.mentionedUsers}
                                  mentions={reply.mentions as any}
                                  participants={participants}
                                  resolvedMentionUsers={resolvedMentionUsers}
                                  onMentionPress={(uid) => navigate(`/user/${uid}`)}
                                  className="text-sm"
                                />
                              </div>

                              {/* Reply Reaction Summary */}
                              {reply.reactions && reply.reactions.length > 0 && (
                                <div className="mt-1">
                                  <EmojiReactionDisplay
                                    reactions={reply.reactions as Reaction[]}
                                    currentUserId={currentUserId}
                                    onPress={() => {}}
                                    compact
                                  />
                                </div>
                              )}

                              {/* Reply Actions */}
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{reply.createdAt ? formatRelativeTime(reply.createdAt) : ''}</span>
                                <button
                                  onClick={() => openReplyEmojiPicker(index, replyIndex)}
                                  className={cn(
                                    'hover:text-foreground',
                                    getUserReaction(reply.reactions as Reaction[] || [], currentUserId) && 'text-primary'
                                  )}
                                >
                                  <Smile className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleReplyClick(index, replyUser)}
                                  className="hover:text-foreground"
                                >
                                  {t('posts.reply')}
                                </button>
                                {/* Delete reply (own reply or memory owner) */}
                                {(isOwnProfile || (replyUserId && isOwnComment(replyUserId))) && (
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
                        )
                      })}
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
                        placeholder={t('posts.replyTo', { name: commentUser?.name || 'User' })}
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
              )
            })}
          </div>
        )}

        {/* No API IDs hint */}
        {!hasApiIds && (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-muted-foreground text-sm text-center">
              {t('memories.commentsDisabled')}
            </p>
          </div>
        )}

        {/* Comment Input */}
        {hasApiIds && (
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
        )}
      </div>

      {/* Memory Emoji Picker Modal */}
      <EmojiReactionPicker
        visible={showMemoryEmojiPicker}
        onClose={() => setShowMemoryEmojiPicker(false)}
        onSelectEmoji={handleMemoryEmojiSelect}
        currentUserReaction={userReaction}
      />

      {/* Comment Emoji Picker Modal */}
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

      {/* Reactions Modal (Who reacted) */}
      <ReactionsModal
        visible={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        users={reactionUsers}
        isLoading={isLoadingReactionUsers}
        onUserPress={(uid) => {
          setShowReactionsModal(false)
          navigate(`/user/${uid}`)
        }}
      />
    </div>
  )
}
