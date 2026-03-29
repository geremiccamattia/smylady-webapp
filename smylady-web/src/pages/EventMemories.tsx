import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { memoriesService, Memory, getMemoryUrl, getMemoryType, getMemoryId, getMemoryDate, getUploadedByInfo, isMemoryHighlighted } from '@/services/memories'
import { ticketsService } from '@/services/tickets'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { MemoryViewer, MemoryUpload } from '@/components/memories'
import ReportModal from '@/components/ReportModal'
import { getUserReaction, Reaction } from '@/components/emojiReaction/EmojiReactionPicker'
import { getInitials, resolveImageUrl, formatRelativeTime } from '@/lib/utils'
import {
  ArrowLeft,
  Image,
  Video,
  Heart,
  MessageCircle,
  Upload,
  Loader2,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'mostLiked'

export default function EventMemories() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const currentUserId = user?.id || user?._id

  // State from notification navigation
  const navState = location.state as { memoryId?: string; memoryIndex?: number } | null

  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [reportingMemory, setReportingMemory] = useState<Memory | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventById(eventId!),
    enabled: !!eventId,
  })

  const eventHasStarted = event ? new Date(event.eventDate) <= new Date() : false

  // Fetch event memories - handle 403 gracefully (user needs ticket to view)
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['eventMemories', eventId],
    queryFn: async () => {
      try {
        return await memoriesService.getEventMemories(eventId!)
      } catch (error: any) {
        // 403 = user doesn't have ticket, return empty array
        if (error?.response?.status === 403) {
          return []
        }
        throw error
      }
    },
    enabled: !!eventId,
  })

  // Check if user has a ticket for this event
  const { data: userTicket } = useQuery({
    queryKey: ['userTicketForEvent', eventId, currentUserId],
    queryFn: async () => {
      // Backend returns userId (not creator), so check both for compatibility
      const creatorData = event?.creator || event?.userId
      // Handle both populated object and string ID
      let creatorId: string | null = null
      if (creatorData) {
        if (typeof creatorData === 'string') {
          creatorId = creatorData
        } else {
          creatorId = (creatorData as any)._id || (creatorData as any).id || null
        }
      }
      const userId = user ? (user._id || user.id) : null
      const isOwner = !!(userId && creatorId && userId === creatorId)

      // Organizer gets automatic ticket
      if (isOwner) {
        try {
          const result = await memoriesService.getOrganizerTicket(eventId!)
          if (result?.ticketId) return result
        } catch {
          // Organizer ticket failed, fall through to regular ticket check
        }
      }
      // Regular users (or organizer fallback) need a purchased ticket
      try {
        const tickets = await ticketsService.getUserTickets()
        const ticket = tickets?.find((t: any) => {
          const ticketEventId = typeof t.event === 'object' ? (t.event._id || t.event.id) : t.event
          return ticketEventId === eventId
        })
        if (ticket) return { ticketId: ticket._id || ticket.id }
      } catch {
        // No purchased ticket found
      }
      // Last resort: try organizer ticket even if isOwner check failed
      if (!isOwner && userId) {
        try {
          const result = await memoriesService.getOrganizerTicket(eventId!)
          if (result?.ticketId) return result
        } catch {
          // Not an organizer, ignore 403
        }
      }
      return null
    },
    enabled: !!eventId && !!user && !!event,
  })

  // Delete memory mutation
  const deleteMutation = useMutation({
    mutationFn: ({ memoryId }: { memoryId: string }) => {
      if (!userTicket?.ticketId) throw new Error('No ticket')
      return memoriesService.deleteMemory(userTicket.ticketId, memoryId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMemories', eventId] })
      setSelectedMemory(null)
      toast({ title: t('common.success'), description: t('memories.deleted') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('memories.deleteError'), variant: 'destructive' })
    },
  })

  // Toggle reaction mutation
  const reactionMutation = useMutation({
    mutationFn: ({ memoryId, emoji }: { memoryId: string; emoji: string }) => {
      if (!userTicket?.ticketId) throw new Error('No ticket')
      return memoriesService.toggleReaction(userTicket.ticketId, memoryId, emoji)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMemories', eventId] })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.reactionError'), variant: 'destructive' })
    },
  })

  // Toggle highlight mutation
  const highlightMutation = useMutation({
    mutationFn: ({ memoryId }: { memoryId: string }) => {
      if (!userTicket?.ticketId) throw new Error('No ticket')
      return memoriesService.toggleHighlight(userTicket.ticketId, memoryId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMemories', eventId] })
    },
  })

  // Add photo tag mutation
  const tagMutation = useMutation({
    mutationFn: ({ memoryId, userId, x, y }: { memoryId: string; userId: string; x: number; y: number }) => {
      if (!userTicket?.ticketId) throw new Error('No ticket')
      return memoriesService.addPhotoTag(userTicket.ticketId, memoryId, userId, x, y)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventMemories', eventId] })
      toast({ title: 'Erfolg', description: 'Person markiert' })
    },
  })

  // Fetch event participants for tagging
  const { data: participants = [] } = useQuery({
    queryKey: ['eventParticipants', eventId],
    queryFn: () => memoriesService.getEventParticipants(eventId!),
    enabled: !!eventId && eventHasStarted,
  })

  // Sort memories
  const sortedMemories = useMemo(() => {
    const sorted = [...memories]
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(getMemoryDate(b)).getTime() - new Date(getMemoryDate(a)).getTime())
      case 'oldest':
        return sorted.sort((a, b) => new Date(getMemoryDate(a)).getTime() - new Date(getMemoryDate(b)).getTime())
      case 'mostLiked':
        return sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      default:
        return sorted
    }
  }, [memories, sortBy])

  // Keep selectedMemory in sync with fresh query data
  useEffect(() => {
    if (selectedMemory && memories.length > 0) {
      const freshMemory = memories.find(m => getMemoryId(m) === getMemoryId(selectedMemory))
      if (freshMemory && freshMemory !== selectedMemory) {
        setSelectedMemory(freshMemory)
      }
    }
  }, [memories])

  // Open specific memory when navigating from notification
  useEffect(() => {
    if (navState?.memoryId && memories.length > 0 && !selectedMemory) {
      const targetMemory = memories.find(m => getMemoryId(m) === navState.memoryId)
      if (targetMemory) {
        setSelectedMemory(targetMemory)
        // Clear navigation state to prevent re-opening on subsequent renders
        navigate(location.pathname, { replace: true, state: null })
      }
    }
  }, [navState, memories, selectedMemory, navigate, location.pathname])

  // Handle memory update from MemoryViewer (instant update before query refetch)
  const handleMemoryUpdate = useCallback((updatedMemory: Memory) => {
    setSelectedMemory(updatedMemory)
  }, [])

  const isOwnMemory = (memory: Memory) => {
    const uploaderInfo = getUploadedByInfo(memory)
    return uploaderInfo._id?.toString() === currentUserId?.toString()
  }

  const isLiked = (memory: Memory) => {
    return memory.likes?.includes(currentUserId || '')
  }

  // Get reaction count (deduplicate reactions + likes to avoid double counting)
  const getReactionCount = (memory: Memory) => {
    const reactionUserIds = new Set(memory.reactions?.map(r => r.userId) || [])
    const likeUserIds = memory.likes || []
    likeUserIds.forEach(id => reactionUserIds.add(id))
    return reactionUserIds.size
  }

  const getUserMemoryReaction = (memory: Memory): string | undefined => {
    return getUserReaction(memory.reactions as Reaction[] || [], currentUserId)
  }

  const handleReaction = (memoryId: string, emoji: string) => {
    reactionMutation.mutate({ memoryId, emoji })
  }

  const handleDelete = (memoryId: string) => {
    if (confirm(t('memories.deleteConfirm'))) {
      deleteMutation.mutate({ memoryId })
    }
  }

  const handleToggleHighlight = (memoryId: string) => {
    highlightMutation.mutate({ memoryId })
  }

  const handleAddTag = (memoryId: string, userId: string, x: number, y: number) => {
    tagMutation.mutate({ memoryId, userId, x, y })
  }

  const canUpload = !!userTicket?.ticketId && eventHasStarted

  if (eventLoading || memoriesLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Event nicht gefunden</h2>
        <p className="text-muted-foreground mb-8">Das Event existiert nicht oder wurde gelöscht.</p>
        <Link to="/explore">
          <Button>Zurück zur Übersicht</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Button>

      {/* Event Info Header */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Event Thumbnail */}
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={resolveImageUrl(event.thumbnailUrl || event.locationImages?.[0]?.url || event.images?.[0]) || 'https://via.placeholder.com/96'}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              <Link to={`/event/${eventId}`} className="hover:underline">
                <h1 className="text-xl font-bold truncate">{event.name}</h1>
              </Link>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.eventDate).toLocaleDateString('de-DE')}</span>
                </div>
                {event.eventStartTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.eventStartTime}</span>
                  </div>
                )}
                {event.locationName && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{event.locationName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memories Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Image className="w-6 h-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Erinnerungen</h2>
          <span className="text-muted-foreground">({memories.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Options */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('newest')}
              className="gap-1"
            >
              <Clock className="w-4 h-4" />
              Neueste
            </Button>
            <Button
              variant={sortBy === 'mostLiked' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('mostLiked')}
              className="gap-1"
            >
              <Heart className="w-4 h-4" />
              Beliebt
            </Button>
          </div>

          {/* Upload Button */}
          {canUpload && (
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              {t('memories.uploadPhoto')}
            </Button>
          )}
        </div>
      </div>

      {/* Upload hint for users without ticket */}
      {!userTicket?.ticketId && isAuthenticated && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground mb-6">
          <p>{t('memories.needTicket')}</p>
          <Link to={`/event/${eventId}`} className="text-primary hover:underline">
            {t('tickets.buyNow')}
          </Link>
        </div>
      )}

      {/* Not logged in hint */}
      {!isAuthenticated && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground mb-6">
          <p>Melde dich an und kaufe ein Ticket, um Fotos und Videos zu teilen.</p>
          <Link to="/login" className="text-primary hover:underline">
            Jetzt anmelden
          </Link>
        </div>
      )}

      {/* Empty State */}
      {memories.length === 0 && (
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('memories.noMemories')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {eventHasStarted
              ? t('memories.beFirst')
              : t('memories.uploadAfterStart')
            }
          </p>
          {canUpload && (
            <Button onClick={() => setShowUpload(true)} className="mt-4 gap-2">
              <Upload className="w-4 h-4" />
              {t('memories.firstUpload')}
            </Button>
          )}
        </div>
      )}

      {/* Memories Grid */}
      {memories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedMemories.map((memory) => {
            const memoryUrl = getMemoryUrl(memory)
            const memoryType = getMemoryType(memory)
            const uploaderInfo = getUploadedByInfo(memory)

            return (
            <div
              key={getMemoryId(memory)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setSelectedMemory(memory)}
            >
              {/* Media */}
              {memoryType === 'video' ? (
                <div className="relative w-full h-full bg-black">
                  <video
                    src={resolveImageUrl(memoryUrl)}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={resolveImageUrl(memoryUrl)}
                  alt={memory.caption || 'Memory'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Memory'
                  }}
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    {isLiked(memory) ? (
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    ) : (
                      <span className="text-lg">👍</span>
                    )}
                    <span className="text-sm">{getReactionCount(memory)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{memory.comments?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Uploader Avatar */}
              <div className="absolute top-2 left-2">
                <Avatar className="w-8 h-8 border-2 border-white shadow-md">
                  <AvatarImage src={resolveImageUrl(uploaderInfo.profileImage)} />
                  <AvatarFallback className="text-xs bg-primary text-white">
                    {getInitials(uploaderInfo.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Caption Preview */}
              {memory.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm line-clamp-2">{memory.caption}</p>
                </div>
              )}
            </div>
          )}
          )}
        </div>
      )}

      {/* Memory Viewer Modal */}
      {selectedMemory && userTicket?.ticketId && (
        <MemoryViewer
          memory={selectedMemory}
          ticketId={selectedMemory.ticketId || userTicket.ticketId}
          eventId={eventId}
          onClose={() => setSelectedMemory(null)}
          onDelete={isOwnMemory(selectedMemory) ? () => handleDelete(getMemoryId(selectedMemory)) : undefined}
          onReaction={(emoji) => handleReaction(getMemoryId(selectedMemory), emoji)}
          userReaction={getUserMemoryReaction(selectedMemory)}
          reactionCount={getReactionCount(selectedMemory)}
          onToggleHighlight={isOwnMemory(selectedMemory) ? () => handleToggleHighlight(getMemoryId(selectedMemory)) : undefined}
          isHighlighted={isMemoryHighlighted(selectedMemory)}
          photoTags={selectedMemory.photoTags}
          participants={participants}
          canTag={eventHasStarted && isOwnMemory(selectedMemory)}
          onAddTag={(userId, x, y) => handleAddTag(getMemoryId(selectedMemory), userId, x, y)}
          onReport={!isOwnMemory(selectedMemory) ? () => setReportingMemory(selectedMemory) : undefined}
          onMemoryUpdate={handleMemoryUpdate}
        />
      )}

      {/* Read-only viewer for users without ticket */}
      {selectedMemory && !userTicket?.ticketId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedMemory(null)}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[90vh]">
            {getMemoryType(selectedMemory) === 'video' ? (
              <video
                src={resolveImageUrl(getMemoryUrl(selectedMemory))}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <img
                src={resolveImageUrl(getMemoryUrl(selectedMemory))}
                alt={selectedMemory.caption || 'Memory'}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Memory'
                }}
              />
            )}
          </div>

          {/* Caption and Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="max-w-4xl mx-auto">
              {(() => {
                const selectedUploaderInfo = getUploadedByInfo(selectedMemory)
                return (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-10 h-10 border-2 border-white">
                        <AvatarImage src={resolveImageUrl(selectedUploaderInfo.profileImage)} />
                        <AvatarFallback>{getInitials(selectedUploaderInfo.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{selectedUploaderInfo.name}</p>
                        <p className="text-white/70 text-sm">{formatRelativeTime(getMemoryDate(selectedMemory))}</p>
                      </div>
                    </div>
                    {selectedMemory.caption && (
                      <p className="text-white mt-2">{selectedMemory.caption}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-white/80">
                      <div className="flex items-center gap-1">
                        <Heart className="w-5 h-5" />
                        <span>{selectedMemory.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5" />
                        <span>{selectedMemory.comments?.length || 0}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingMemory && userTicket?.ticketId && (
        <ReportModal
          open={!!reportingMemory}
          onClose={() => setReportingMemory(null)}
          contentType="memory"
          ticketId={userTicket.ticketId}
          eventId={eventId!}
          memoryIndex={memories.findIndex(m => getMemoryId(m) === getMemoryId(reportingMemory))}
        />
      )}

      {/* Upload Modal */}
      {showUpload && userTicket?.ticketId && (
        <MemoryUpload
          ticketId={userTicket.ticketId}
          eventId={eventId!}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            queryClient.invalidateQueries({ queryKey: ['eventMemories', eventId] })
          }}
        />
      )}
    </div>
  )
}
