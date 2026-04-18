import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { eventsService } from '@/services/events'
import { favoritesService } from '@/services/favorites'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatPrice, formatEventTime, getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { useState } from 'react'
import EventReviews from '@/components/reviews/EventReviews'
import { ImageViewer } from '@/components/ImageViewer'
import { PaymentWrapper, usePaymentModal } from '@/components/payment'
import { useCreatePaymentIntent, useBuyFreeEvent } from '@/hooks/useStripe'
import { MemoryGallery } from '@/components/memories'
import { ticketsService } from '@/services/tickets'
import { chatService } from '@/services/chat'
import { memoriesService, getMemoryUrl, getMemoryType, getMemoryId, getUploadedByInfo } from '@/services/memories'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import QRCode from 'react-qr-code'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Share2,
  Ticket,
  Music,
  Info,
  User,
  MessageCircle,
  ScanLine,
  Image,
  ExternalLink,
  CheckCircle,
  ShieldCheck,
  LogIn,
  UserPlus,
  Trash2,
} from 'lucide-react'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [imageViewerIndex, setImageViewerIndex] = useState(0)

  // Stripe payment hooks
  const { isOpen: isPaymentOpen, paymentData, openPayment, closePayment } = usePaymentModal()
  const { mutate: createPaymentIntent } = useCreatePaymentIntent()
  const { mutate: buyFreeEvent } = useBuyFreeEvent()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id, isAuthenticated],
    queryFn: () => {
      // Use public endpoint when not authenticated, authenticated endpoint otherwise
      if (isAuthenticated) {
        return eventsService.getEventById(id!)
      }
      return eventsService.getPublicEventById(id!)
    },
    enabled: !!id,
    retry: (failureCount, err: any) => {
      // Don't retry on 403 (visibility restricted)
      if (err?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  // Check if the error is a 403 (visibility restricted - subscriber only / invited only)
  const isAccessDenied = (error as any)?.response?.status === 403

  // Calculate derived values that depend on event
  // Backend returns userId (not creator), so check both for compatibility
  // userId can be a populated object OR a plain string (ObjectId)
  const creatorData = event?.creator || event?.userId
  const creator = creatorData && typeof creatorData !== 'string' ? creatorData : null
  const creatorId = creatorData
    ? (typeof creatorData === 'string'
        ? creatorData
        : ((creatorData as any)._id || (creatorData as any).id || null))
    : null
  const currentUserId = user ? (user._id || user.id) : null
  const isOwner = !!(currentUserId && creatorId && currentUserId === creatorId)
  const eventHasStarted = event ? new Date(event.eventDate) <= new Date() : false

  // Check if this is an external/Ticketmaster event
  const isExternalEvent = event?.isTicketmaster || event?.isExternalEvent || event?.source === 'ticketmaster'
  const externalUrl = event?.ticketmasterUrl || event?.externalUrl

  // Redirect to external URL if this is a Ticketmaster/external event
  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'event_detail_view', event_id: id })
  }, [id])

  useEffect(() => {
    if (isExternalEvent && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer')
      // Navigate back to explore page after opening external link
      navigate('/explore', { replace: true })
    }
  }, [isExternalEvent, externalUrl, navigate])

  useEffect(() => {
    if (event?.ticketTiers && event?.ticketTiers?.length > 0) {
      const firstAvailable = event?.ticketTiers?.find((tier: any) =>
        tier.quantity == null || tier.soldCount < tier.quantity
      )
      if (firstAvailable) {
        setSelectedTierId(firstAvailable._id)
      }
    }
  }, [event])

  // Fetch user's ticket for this event (for uploading memories)
  // MUST be called before any conditional returns to follow React hook rules
  const { data: userTicket } = useQuery({
    queryKey: ['userTicketForEvent', id, user?.id || user?._id, isOwner],
    queryFn: async () => {
      // First try to get organizer ticket if user is owner
      if (isOwner) {
        try {
          const result = await memoriesService.getOrganizerTicket(id!)
          if (result?.ticketId) return result
        } catch {
          // Organizer ticket failed, fall through to regular ticket check
        }
      }
      // For regular users (or organizer fallback), get their purchased ticket
      try {
        const tickets = await ticketsService.getUserTickets()
        const ticket = tickets?.find((t: any) => {
          const ticketEventId = typeof t.event === 'object' ? (t.event._id || t.event.id) : t.event
          return ticketEventId === id
        })
        if (ticket) return { ticketId: ticket._id || ticket.id }
      } catch {
        // No purchased ticket found
      }
      // Last resort for organizer: try organizer ticket even if isOwner check failed
      // (handles cases where creator field format differs)
      if (!isOwner && currentUserId) {
        try {
          const result = await memoriesService.getOrganizerTicket(id!)
          if (result?.ticketId) return result
        } catch {
          // Not an organizer, ignore 403
        }
      }
      return null
    },
    enabled: !!id && !!user && !!event,
  })

  // Fetch event memories - handle 403 gracefully (user needs ticket to view)
  // MUST be called before any conditional returns to follow React hook rules
  const { data: eventMemories = [] } = useQuery({
    queryKey: ['eventMemories', id],
    queryFn: async () => {
      try {
        return await memoriesService.getEventMemories(id!)
      } catch (error: any) {
        // 403 = user doesn't have ticket, return empty array
        if (error?.response?.status === 403) {
          return []
        }
        throw error
      }
    },
    enabled: !!id && eventHasStarted && isAuthenticated,
  })

  // Fetch user's purchased ticket for this event (to display ticket info on event page)
  const { data: purchasedTicket } = useQuery({
    queryKey: ['purchasedTicketForEvent', id, user?.id || user?._id],
    queryFn: async () => {
      const tickets = await ticketsService.getMyTickets()
      const ticket = tickets?.find((t: any) => {
        const ticketEventId = typeof t.event === 'object' ? (t.event._id || t.event.id) : t.event
        return ticketEventId === id
      })
      return ticket || null
    },
    enabled: !!id && !!user && !isOwner,
  })

  const handlePurchaseTicket = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    if (!id || !event) return

    // If event has tiers, require a selection
    if (event.ticketTiers && event.ticketTiers?.length > 0 && !selectedTierId) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('events.selectTicketType', { defaultValue: 'Bitte wähle einen Tickettyp aus.' }),
      })
      return
    }

    setIsPurchasing(true)

    // Determine price: use selected tier price if tiers exist, else event price
    const selectedTier = event.ticketTiers?.find((t: any) => t._id === selectedTierId)
    const numericPrice = selectedTier
      ? selectedTier.price
      : (typeof event.price === 'string' ? parseFloat(event.price) : event.price)
    const isFree = !numericPrice || numericPrice <= 0

    if (isFree) {
      buyFreeEvent({ eventId: id, tierId: selectedTierId || undefined }, {
        onSuccess: (ticket) => {
          toast({ title: t('common.success'), description: t('tickets.freeCreated') })
          navigate(`/payment-complete?ticketId=${ticket?._id || ticket?.id}`)
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.response?.data?.message || error.message || t('tickets.purchaseFailed'),
          })
        },
        onSettled: () => setIsPurchasing(false),
      })
    } else {
      createPaymentIntent({ eventId: id, tierId: selectedTierId || undefined }, {
        onSuccess: (data) => {
          const paymentIntentId = data.paymentIntentId || data.clientSecret?.split('_secret_')[0] || ''
          openPayment({
            clientSecret: data.clientSecret,
            paymentIntentId,
            eventName: event.name || 'Event',
            amount: data.amount || numericPrice || 0,
          })
          setIsPurchasing(false)
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.response?.data?.message || error.message || t('tickets.paymentInitFailed'),
          })
          setIsPurchasing(false)
        },
      })
    }
  }

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(id!)
        setIsFavorite(false)
        toast({ title: t('favorites.removed') })
      } else {
        await favoritesService.addFavorite(id!)
        setIsFavorite(true)
        toast({ title: t('favorites.added') })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('common.actionFailed'),
      })
    }
  }

  const handleShare = async () => {
    const url = `https://app.shareyourparty.de/redirect/event/${id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.name,
          text: t('events.shareText', { name: event?.name }),
          url,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(url)
      toast({ title: t('common.linkCopied') })
    }
  }

  const handleDeleteEvent = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await eventsService.deleteEvent(id)
      toast({
        title: t('common.success'),
        description: t('events.deleteSuccess', { defaultValue: 'Event wurde gelöscht' }),
      })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['my-events'] })
      navigate('/my-events', { replace: true })
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || t('events.deleteFailed', { defaultValue: 'Event konnte nicht gelöscht werden' })
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: message,
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="aspect-[21/9] bg-muted rounded-xl" />
          <div className="h-8 bg-muted rounded mt-4 w-3/4" />
          <div className="h-4 bg-muted rounded mt-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (isAccessDenied) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShieldCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('event.accessDeniedTitle', { defaultValue: 'Zugriff eingeschränkt' })}</h2>
        <p className="text-muted-foreground mb-8">
          {t('event.accessDeniedDescription', { defaultValue: 'Dieses Event ist nur für Subscriber des Veranstalters sichtbar. Folge dem Veranstalter, um Zugang zu erhalten.' })}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t('common.back', { defaultValue: 'Zurück' })}
          </Button>
          <Link to="/explore">
            <Button>{t('event.exploreEvents', { defaultValue: 'Events entdecken' })}</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">{t('events.notFound')}</h2>
        <p className="text-muted-foreground mb-8">{t('events.notFoundDescription')}</p>
        <Link to="/explore">
          <Button>{t('common.backToOverview')}</Button>
        </Link>
      </div>
    )
  }

  const availableTickets = event.availableTickets ?? (event.totalTickets - (event.soldTickets || 0))
  // Use the backend's soldOut flag as the primary source of truth.
  // Only fall back to availableTickets check when totalTickets is explicitly set (> 0)
  const isSoldOut = event.soldOut === true || (event.totalTickets > 0 && availableTickets <= 0)

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

      {/* Hero Image */}
      <div className="relative aspect-[21/9] rounded-xl overflow-hidden mb-6">
        <img
          src={resolveImageUrl(event.locationImages?.[0]?.url || event.thumbnailUrl || event.images?.[0]) || 'https://via.placeholder.com/1200x500?text=Event'}
          alt={event.name}
          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => {
            setImageViewerIndex(0)
            setImageViewerOpen(true)
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x500?text=Event'
          }}
        />
        {/* Actions Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        {/* External Event Badge */}
        {isExternalEvent && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Ticketmaster
          </div>
        )}
        {/* Price Badge */}
        <div className={cn(
          "absolute bottom-4 left-4 px-4 py-2 rounded-lg text-white font-bold text-lg",
          isExternalEvent ? "bg-blue-600" : "gradient-bg"
        )}>
          {isExternalEvent
            ? t('event.priceOnWebsite', { defaultValue: 'Preis auf Website' })
            : (() => {
                const tiers = (event as any).ticketTiers
                if (tiers && tiers.length > 0) {
                  const minPrice = Math.min(...tiers.map((t: any) => t.price))
                  return `Ab ${formatPrice(minPrice)}`
                }
                return Number(event.price) > 0 ? formatPrice(event.price) : t('events.free')
              })()
          }
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Category */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {isExternalEvent && (
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Ticketmaster
                </span>
              )}
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {event.category}
              </span>
              {event.musicType && (
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                  <Music className="h-3 w-3 inline mr-1" />
                  {event.musicType}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
          </div>

          {/* Organizer - hide for external events */}
          {creator && !isExternalEvent && (
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border">
              <Avatar className="h-12 w-12">
                <AvatarImage src={resolveImageUrl(creator.profileImage)} alt={creator.name} />
                <AvatarFallback className="gradient-bg text-white">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('events.organizer')}</p>
                <p className="font-semibold">{creator.name}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/user/${creatorId}`}>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    {t('common.profile')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      setShowAuthModal(true)
                      return
                    }
                    try {
                      const chatRoom = await chatService.getOrCreateRoom(creatorId!)
                      const roomId = chatRoom._id || (chatRoom as any).id || (chatRoom as any).roomId
                      if (roomId) {
                        navigate(`/chat/${roomId}`)
                      }
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: t('common.error'),
                        description: t('chat.openFailed'),
                      })
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {t('common.chat')}
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('events.aboutEvent')}
            </h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Additional Info */}
          {(() => {
            // Backend returns offerings and restrictions as comma-separated strings, not arrays
            const unwrapField = (value: unknown): string[] => {
              if (!value) return []
              if (Array.isArray(value)) return value.flatMap(unwrapField)
              if (typeof value === 'string') {
                const trimmed = value.trim()
                if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
                  try { return unwrapField(JSON.parse(trimmed)) } catch {}
                }
                return trimmed ? trimmed.split(',').map(s => s.trim()).filter(Boolean) : []
              }
              return [String(value)]
            }
            const offeringsArray = unwrapField(event.offerings)
            const restrictionsArray = unwrapField(event.restrictions)

            if (offeringsArray.length === 0 && restrictionsArray.length === 0) return null

            return (
              <div className="grid md:grid-cols-2 gap-4">
                {offeringsArray.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                      {t('events.offerings')}
                    </h3>
                    <ul className="space-y-1">
                      {offeringsArray.map((item, i) => (
                        <li key={i} className="text-sm text-green-600 dark:text-green-400">
                          ✓ {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {restrictionsArray.length > 0 && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">
                      {t('events.restrictions')}
                    </h3>
                    <ul className="space-y-1">
                      {restrictionsArray.map((item, i) => (
                        <li key={i} className="text-sm text-orange-600 dark:text-orange-400">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Images Gallery */}
          {(() => {
            // Support both locationImages array and images array
            const galleryImages = event.locationImages && event.locationImages.length > 0
              ? event.locationImages.map(img => img.url)
              : event.images || []

            if (galleryImages.length <= 1) return null

            return (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('events.images')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {galleryImages.map((img, i) => (
                    <img
                      key={i}
                      src={resolveImageUrl(img)}
                      alt={`${event.name} - ${t('events.image')} ${i + 1}`}
                      className="rounded-lg aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setImageViewerIndex(i)
                        setImageViewerOpen(true)
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Memories Section - Only for internal events */}
          {eventHasStarted && !isExternalEvent && (
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">{t('memories.title')}</h2>
                  <span className="text-sm text-muted-foreground">({eventMemories.length})</span>
                </div>
                {eventMemories.length > 0 && (
                  <Link to={`/event/${id}/memories`}>
                    <Button variant="ghost" size="sm">
                      {t('common.viewAll')}
                    </Button>
                  </Link>
                )}
              </div>

              {userTicket?.ticketId ? (
                <MemoryGallery
                  ticketId={userTicket.ticketId}
                  eventId={id!}
                  eventStartDate={event.eventDate}
                  canUpload={isOwner || event?.allowGuestMemories !== false}
                  isOrganizer={isOwner}
                  allowGuestMemories={event?.allowGuestMemories !== false}
                />
              ) : (
                <div className="space-y-4">
                  {/* Show memories even without ticket (read-only) */}
                  {eventMemories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {eventMemories.slice(0, 8).map((memory: any) => {
                        const memUrl = getMemoryUrl(memory)
                        const memType = getMemoryType(memory)
                        const uploaderInfo = getUploadedByInfo(memory)
                        return (
                        <div
                          key={getMemoryId(memory)}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => navigate(`/event/${id}/memories`)}
                        >
                          {memType === 'video' ? (
                            <div className="relative w-full h-full bg-black">
                              <video
                                src={resolveImageUrl(memUrl)}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={resolveImageUrl(memUrl)}
                              alt={memory.caption || 'Memory'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Memory'
                              }}
                            />
                          )}
                          {/* Uploader avatar */}
                          <div className="absolute bottom-2 left-2">
                            <Avatar className="w-6 h-6 border-2 border-white">
                              <AvatarImage src={resolveImageUrl(uploaderInfo.profileImage)} />
                              <AvatarFallback className="text-xs">
                                {getInitials(uploaderInfo.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1 text-white">
                              <Heart className="w-5 h-5" />
                              <span>{memory.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-white">
                              <MessageCircle className="w-5 h-5" />
                              <span>{memory.comments?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('memories.noMemories')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('events.buyTicketToShare')}
                      </p>
                    </div>
                  )}

                  {eventMemories.length > 8 && (
                    <div className="text-center">
                      <Link to={`/event/${id}/memories`}>
                        <Button variant="outline">
                          {t('memories.viewAllCount', { count: eventMemories.length })}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reviews Section - Only for internal events */}
          {!isExternalEvent && (
            <EventReviews
              eventId={id!}
              eventEnded={new Date(event.eventDate) < new Date()}
            />
          )}

          {/* User's Purchased Ticket Section - Below Reviews */}
          {purchasedTicket && !isExternalEvent && (
            <Card className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-4 space-y-4">
                {/* Ticket Header */}
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">{t('tickets.youHaveTicket')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('tickets.purchasedOn')} {format(new Date(purchasedTicket.purchaseDate || purchasedTicket.createdAt), 'dd.MM.yyyy', { locale: t('common.locale') === 'de' ? de : enUS })}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                {(purchasedTicket.status === 'valid' || purchasedTicket.status === 'active') && !purchasedTicket.isScanned && (
                  <div className="flex flex-col items-center py-4 bg-white rounded-lg">
                    <p className="text-sm font-medium mb-3">{t('tickets.yourQrCode')}</p>
                    <div className="p-3 bg-white rounded-lg shadow-sm border">
                      {purchasedTicket.qrCode && purchasedTicket.qrCode.startsWith('data:image') ? (
                        <img
                          src={purchasedTicket.qrCode}
                          alt="Ticket QR Code"
                          className="w-[180px] h-[180px] object-contain"
                        />
                      ) : (
                        <QRCode
                          id="event-ticket-qr-code"
                          value={JSON.stringify({
                            ticketId: purchasedTicket._id || purchasedTicket.id,
                            userId: purchasedTicket.userId || (typeof purchasedTicket.user === 'string' ? purchasedTicket.user : (purchasedTicket.user as any)?._id),
                            eventId: id,
                            verificationCode: purchasedTicket.verificationCode || '',
                          })}
                          size={180}
                          level="H"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {t('tickets.showAtEntrance')}
                    </p>
                  </div>
                )}

                {/* Scanned Status */}
                {purchasedTicket.isScanned && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('tickets.scanned')}</p>
                      {purchasedTicket.scannedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {format(new Date(purchasedTicket.scannedAt), 'dd.MM.yyyy HH:mm', { locale: t('common.locale') === 'de' ? de : enUS })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Ticket Info */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('tickets.ticketId')}</span>
                    <span className="font-mono text-xs">
                      {((purchasedTicket._id || purchasedTicket.id) as string)?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('tickets.status')}</span>
                    <span className={cn(
                      "font-medium",
                      purchasedTicket.isScanned ? "text-green-600" :
                      purchasedTicket.status === 'cancelled' ? "text-red-600" :
                      "text-blue-600"
                    )}>
                      {purchasedTicket.isScanned ? t('tickets.used') :
                       purchasedTicket.status === 'cancelled' ? t('tickets.cancelled') :
                       t('tickets.valid')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('tickets.price')}</span>
                    <span>{formatPrice(purchasedTicket.totalAmount || purchasedTicket.price || 0)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Link to={`/ticket/${purchasedTicket._id || purchasedTicket.id}`} className="block">
                    <Button variant="gradient" className="w-full gap-2">
                      <Ticket className="h-4 w-4" />
                      {t('tickets.viewDetails')}
                    </Button>
                  </Link>

                  {/* Safety Companion Link */}
                  <Link to="/safety-companions" className="block">
                    <Button variant="outline" className="w-full gap-2 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30">
                      <ShieldCheck className="h-4 w-4" />
                      {t('safety.addSafetyCompanionButton')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Ticket Purchase */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 bg-card rounded-xl border shadow-lg space-y-4">
            {/* Date & Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('events.date')}</p>
                  <p className="font-semibold">{formatDate(event.eventDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('events.time')}</p>
                  <p className="font-semibold">
                    {formatEventTime(event.eventStartTime)}{event.eventEndTime ? ` - ${formatEventTime(event.eventEndTime)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('events.location')}</p>
                  <p className="font-semibold">{event.locationName}</p>
                </div>
              </div>
              {/* Tickets available - hide for external events */}
              {!isExternalEvent && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('events.available')}</p>
                    <p className="font-semibold">
                      {isSoldOut ? t('events.soldOut') : `${availableTickets} Tickets`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <hr />

            {/* External Event Info */}
            {isExternalEvent ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      {t('event.externalEvent', { defaultValue: 'Externes Event' })}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t('event.externalEventDescription', {
                      defaultValue: 'Dieses Event wird von Ticketmaster angeboten. Tickets können nur auf der Ticketmaster-Website gekauft werden.'
                    })}
                  </p>
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => externalUrl && window.open(externalUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-5 w-5" />
                  {t('event.viewOnTicketmaster', { defaultValue: 'Auf Ticketmaster ansehen' })}
                </Button>
              </div>
            ) : (
              <>
                {/* Price / Ticket Tiers */}
                {event.ticketTiers && event.ticketTiers?.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {t('events.selectTicketType', { defaultValue: 'Tickettyp wählen' })}
                    </p>
                    {event.ticketTiers?.map((tier: any) => {
                      const isTierSoldOut = tier.quantity != null && tier.soldCount >= tier.quantity
                      const isSelected = selectedTierId === tier._id
                      return (
                        <div
                          key={tier._id}
                          onClick={() => !isTierSoldOut && setSelectedTierId(tier._id)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            isTierSoldOut
                              ? 'opacity-50 cursor-not-allowed border-muted'
                              : isSelected
                              ? 'border-primary cursor-pointer bg-primary/5'
                              : 'border-muted cursor-pointer hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                isSelected && !isTierSoldOut
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              }`} />
                              <span className={`font-medium text-sm ${isTierSoldOut ? 'line-through' : ''}`}>
                                {tier.name}
                              </span>
                            </div>
                            <span className="font-bold text-sm">
                              {tier.price === 0 ? t('events.free') : formatPrice(tier.price)}
                            </span>
                          </div>
                          {tier.description && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6 truncate">
                              {tier.description}
                            </p>
                          )}
                          {isTierSoldOut && (
                            <p className="text-xs text-red-500 mt-1 ml-6">
                              {t('events.soldOut')}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">{t('events.price')}</span>
                    <span className="text-xl font-bold">
                      {Number(event.price) > 0 ? formatPrice(event.price) : t('events.free')}
                    </span>
                  </div>
                )}

                {/* Purchase Button */}
                {isOwner ? (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/edit-event/${id}`}>{t('events.editEvent')}</Link>
                    </Button>
                    <Button variant="gradient" className="w-full gap-2" asChild>
                      <Link to={`/scan/${id}`}>
                        <ScanLine className="h-4 w-4" />
                        {t('tickets.scanTickets')}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <Link to={`/scan/${id}/statistics?name=${encodeURIComponent(event?.name || '')}`}>
                        <Users className="h-4 w-4" />
                        {t('tickets.scanStatistics')}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('events.deleteEvent', { defaultValue: 'Event löschen' })}
                    </Button>
                  </div>
                ) : purchasedTicket ? (
                  <Button variant="gradient" className="w-full gap-2" asChild>
                    <Link to={`/ticket/${purchasedTicket._id || purchasedTicket.id}`}>
                      <CheckCircle className="h-5 w-5" />
                      {t('tickets.viewTicket', { defaultValue: 'Ticket anzeigen' })}
                    </Link>
                  </Button>
                ) : isSoldOut ? (
                  <Button variant="secondary" className="w-full" disabled>
                    {t('events.soldOut')}
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handlePurchaseTicket}
                    loading={isPurchasing}
                    disabled={
                      isPurchasing ||
                      ((event?.ticketTiers?.length ?? 0) > 0 && !selectedTierId)
                    }
                  >
                    <Ticket className="h-5 w-5" />
                    {Number(event.price) > 0 ? t('tickets.buyTicket') : 'Kostenlos reservieren'}
                  </Button>
                )}
              </>
            )}

            {event.minimumAge && event.minimumAge > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                {t('events.minimumAge')}: {event.minimumAge} {t('events.years')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        images={[
          resolveImageUrl(event.locationImages?.[0]?.url || event.thumbnailUrl || event.images?.[0]) || '',
          ...(event.locationImages && event.locationImages.length > 0
            ? event.locationImages.slice(1).map(img => resolveImageUrl(img.url) || '')
            : (event.images || []).slice(1).map(img => resolveImageUrl(img) || '')
          )
        ].filter(Boolean)}
        initialIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        alt={event.name}
      />

      {/* Stripe Payment Modal */}
      <PaymentWrapper
        isOpen={isPaymentOpen}
        onClose={closePayment}
        clientSecret={paymentData.clientSecret}
        paymentIntentId={paymentData.paymentIntentId}
        eventName={paymentData.eventName}
        amount={paymentData.amount}
      />

      {/* Auth Gate Modal - shown when unauthenticated user tries to book */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4">
              <Ticket className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              {t('auth.loginRequired', { defaultValue: 'Anmeldung erforderlich' })}
            </DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              {t('auth.loginToBookDescription', {
                defaultValue: 'Um ein Ticket zu buchen, musst du eingeloggt sein. Registriere dich kostenlos oder melde dich an.'
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="gradient"
              size="lg"
              className="w-full gap-2 rounded-full"
              onClick={() => {
                setShowAuthModal(false)
                navigate('/register', { state: { from: { pathname: `/event/${id}` } } })
              }}
            >
              <UserPlus className="h-5 w-5" />
              {t('auth.registerFree', { defaultValue: 'Kostenlos registrieren' })}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 rounded-full"
              onClick={() => {
                setShowAuthModal(false)
                navigate('/login', { state: { from: { pathname: `/event/${id}` } } })
              }}
            >
              <LogIn className="h-5 w-5" />
              {t('auth.login', { defaultValue: 'Anmelden' })}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t('auth.authModalHint', {
              defaultValue: 'Nach der Anmeldung wirst du automatisch zu diesem Event zurückgeleitet.'
            })}
          </p>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('events.deleteEventTitle', { defaultValue: 'Event löschen?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('events.deleteEventMessage', { defaultValue: 'Möchtest du dieses Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteEvent}
              disabled={isDeleting}
            >
              {isDeleting
                ? t('common.loading')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
