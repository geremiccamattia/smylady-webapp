import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Image, Video, MessageCircle, Upload, Loader2, Clock, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { memoriesService, Memory, getMemoryUrl, getMemoryType, getMemoryId, getMemoryDate, isMemoryHighlighted, getUploadedByInfo } from '@/services/memories'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getInitials, resolveImageUrl, cn } from '@/lib/utils'
import MemoryViewer from './MemoryViewer'
import MemoryUpload from './MemoryUpload'
import ReportModal from '@/components/ReportModal'
import {
  getUserReaction,
  Reaction,
} from '@/components/emojiReaction/EmojiReactionPicker'

interface MemoryGalleryProps {
  ticketId: string
  eventId: string
  eventStartDate: string
  canUpload?: boolean
  initialMemoryId?: string
  isOrganizer?: boolean
  allowGuestMemories?: boolean
  isPublicEvent?: boolean
}

type SortOption = 'newest' | 'popular'

export default function MemoryGallery({
  ticketId,
  eventId,
  eventStartDate,
  canUpload = true,
  initialMemoryId,
  isOrganizer,
  allowGuestMemories,
  isPublicEvent = false
}: MemoryGalleryProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState<number>(0)
  const [showUpload, setShowUpload] = useState(false)
  const [reportingMemory, setReportingMemory] = useState<Memory | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Check if event has started (uploads allowed after event start)
  const eventHasStarted = new Date(eventStartDate) <= new Date()

  const currentUserId = user?.id || user?._id

  // Fetch memories
  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories', ticketId],
    queryFn: () => memoriesService.getTicketMemories(ticketId),
    enabled: !!ticketId,
  })

  // Fetch event participants for tagging
  const { data: participants = [] } = useQuery({
    queryKey: ['eventParticipants', eventId],
    queryFn: () => memoriesService.getEventParticipants(eventId),
    enabled: !!eventId && eventHasStarted,
  })

  // Sort memories based on selected option
  const sortedMemories = useMemo(() => {
    if (sortBy === 'popular') {
      return [...memories].sort((a, b) => {
        const aLikes = (a.reactions?.length || 0) + (a.likes?.length || 0)
        const bLikes = (b.reactions?.length || 0) + (b.likes?.length || 0)
        return bLikes - aLikes
      })
    }
    // Default: newest first
    return [...memories].sort((a, b) => {
      const aDate = new Date(getMemoryDate(a)).getTime()
      const bDate = new Date(getMemoryDate(b)).getTime()
      return bDate - aDate
    })
  }, [memories, sortBy])

  // Auto-open memory from deep link
  useEffect(() => {
    if (initialMemoryId && memories.length > 0 && !selectedMemory) {
      const memoryIndex = memories.findIndex(m => getMemoryId(m) === initialMemoryId)
      if (memoryIndex >= 0) {
        setSelectedMemory(memories[memoryIndex])
        setSelectedMemoryIndex(memoryIndex)
      }
    }
  }, [initialMemoryId, memories, selectedMemory])

  // Keep selectedMemory in sync with fresh query data
  useEffect(() => {
    if (selectedMemory && memories.length > 0) {
      const freshMemory = memories.find(m => getMemoryId(m) === getMemoryId(selectedMemory))
      if (freshMemory && freshMemory !== selectedMemory) {
        setSelectedMemory(freshMemory)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memories])

  // Handle memory update from MemoryViewer (instant update before query refetch)
  const handleMemoryUpdate = useCallback((updatedMemory: Memory) => {
    setSelectedMemory(updatedMemory)
  }, [])

  // Toggle reaction mutation (replaces simple like)
  const reactionMutation = useMutation({
    mutationFn: ({ memoryId, emoji }: { memoryId: string; emoji: string }) =>
      memoriesService.toggleReaction(ticketId, memoryId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', ticketId] })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('posts.reactionError'), variant: 'destructive' })
    },
  })

  // Toggle highlight mutation
  const highlightMutation = useMutation({
    mutationFn: ({ memoryId }: { memoryId: string }) =>
      memoriesService.toggleHighlight(ticketId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', ticketId] })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('memories.highlightError'), variant: 'destructive' })
    },
  })

  // Add photo tag mutation
  const tagMutation = useMutation({
    mutationFn: ({ memoryId, userId, x, y }: { memoryId: string; userId: string; x: number; y: number }) =>
      memoriesService.addPhotoTag(ticketId, memoryId, userId, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', ticketId] })
      toast({ title: t('common.success'), description: t('memories.personTagged') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('memories.markError'), variant: 'destructive' })
    },
  })

  // Delete memory mutation
  const deleteMutation = useMutation({
    mutationFn: ({ memoryId }: { memoryId: string }) =>
      memoriesService.deleteMemory(ticketId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories', ticketId] })
      setSelectedMemory(null)
      toast({ title: t('common.success'), description: t('memories.deleted') })
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('memories.deleteError'), variant: 'destructive' })
    },
  })

  const handleReaction = (memoryId: string, emoji: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    reactionMutation.mutate({ memoryId, emoji })
  }

  const handleDelete = (memoryId: string) => {
    if (confirm(t('memories.deleteConfirm'))) {
      deleteMutation.mutate({ memoryId })
    }
  }

  const handleAddTag = (memoryId: string, userId: string, x: number, y: number) => {
    tagMutation.mutate({ memoryId, userId, x, y })
  }

  const handleToggleHighlight = (memoryId: string) => {
    highlightMutation.mutate({ memoryId })
  }

  const isOwnMemory = (memory: Memory) => {
    const uploadedByUser = getUploadedByInfo(memory)
    return uploadedByUser._id?.toString() === currentUserId?.toString()
  }

  const getUserMemoryReaction = (memory: Memory): string | undefined => {
    return getUserReaction(memory.reactions as Reaction[] || [], currentUserId)
  }

  const getReactionCount = (memory: Memory): number => {
    const reactionUserIds = new Set(memory.reactions?.map(r => r.userId) || [])
    const likeUserIds = memory.likes || []
    // Merge unique user IDs from both reactions and likes to avoid double counting
    likeUserIds.forEach(id => reactionUserIds.add(id))
    return reactionUserIds.size
  }

  const openMemory = (memory: Memory, index: number) => {
    setSelectedMemory(memory)
    setSelectedMemoryIndex(index)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">{t('memories.title')} ({memories.length})</h3>
        <div className="flex items-center gap-2">
          {/* Sort buttons */}
          {memories.length > 0 && (
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setSortBy('newest')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                  sortBy === 'newest'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">{t('memories.sortNewest')}</span>
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                  sortBy === 'popular'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">{t('memories.sortPopular')}</span>
              </button>
            </div>
          )}
          {(isOrganizer || (canUpload && allowGuestMemories !== false)) && eventHasStarted && (
            <Button onClick={() => setShowUpload(true)} size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('memories.uploadPhoto')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Upload hint for future events */}
      {canUpload && !eventHasStarted && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>📸 {t('memories.uploadAfterStart')}</p>
        </div>
      )}

      {allowGuestMemories === false && !isOrganizer && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          <span>ℹ️</span>
          <span>Der Veranstalter hat den Foto-Upload für Gäste deaktiviert.</span>
        </div>
      )}

      {/* Empty state */}
      {memories.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('memories.noMemories')}</p>
          {(isOrganizer || (canUpload && allowGuestMemories !== false)) && eventHasStarted && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('memories.shareYourBest')}
            </p>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {sortedMemories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {sortedMemories.map((memory, index) => {
            const userReaction = getUserMemoryReaction(memory)
            const reactionCount = getReactionCount(memory)
            const memoryUrl = getMemoryUrl(memory)
            const memoryType = getMemoryType(memory)
            const uploaderInfo = getUploadedByInfo(memory)

            return (
              <div
                key={getMemoryId(memory)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openMemory(memory, index)}
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
                      <Video className="w-8 h-8 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={resolveImageUrl(memoryUrl)}
                    alt={memory.caption || 'Memory'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '0'
                    }}
                  />
                )}

                {/* Highlight badge */}
                {isMemoryHighlighted(memory) && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                )}

                {/* Photo tags indicator */}
                {memory.photoTags && memory.photoTags.length > 0 && (
                  <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white flex items-center gap-1">
                    <span>👤</span>
                    <span>{memory.photoTags.length}</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  {/* Reaction display */}
                  <div className="flex items-center gap-1 text-white">
                    {userReaction ? (
                      <span className="text-lg">{userReaction}</span>
                    ) : (
                      <span className="text-lg">👍</span>
                    )}
                    <span>{reactionCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <MessageCircle className="w-5 h-5" />
                    <span>{memory.comments?.length || 0}</span>
                  </div>
                </div>

                {/* Uploader avatar */}
                <div className="absolute bottom-2 left-2">
                  <Avatar className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={resolveImageUrl(uploaderInfo.profileImage)} />
                    <AvatarFallback className="text-xs">
                      {getInitials(uploaderInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Caption preview */}
                {memory.caption && (
                  <div className="absolute bottom-2 right-2 left-10 text-white text-xs truncate bg-black/50 rounded px-1.5 py-0.5">
                    {memory.caption}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Memory Viewer Modal */}
      {selectedMemory && (
        <MemoryViewer
          memory={selectedMemory}
          ticketId={ticketId}
          eventId={eventId}
          memoryIndex={selectedMemoryIndex}
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
          onReport={!isOwnMemory(selectedMemory) ? () => {
            setReportingMemory(selectedMemory)
          } : undefined}
          onMemoryUpdate={handleMemoryUpdate}
          isPublicEvent={isPublicEvent}
        />
      )}

      {/* Report Modal */}
      {reportingMemory && (
        <ReportModal
          open={!!reportingMemory}
          onClose={() => setReportingMemory(null)}
          contentType="memory"
          ticketId={ticketId}
          eventId={eventId}
          memoryIndex={memories.findIndex(m => getMemoryId(m) === getMemoryId(reportingMemory))}
        />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <MemoryUpload
          ticketId={ticketId}
          eventId={eventId}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            queryClient.invalidateQueries({ queryKey: ['memories', ticketId] })
          }}
          isPublicEvent={isPublicEvent}
        />
      )}
    </div>
  )
}
