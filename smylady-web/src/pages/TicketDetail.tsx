import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ticketsService } from '@/services/tickets'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, cn, resolveImageUrl, getInitials } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  MessageCircle,
  Flag,
  ShieldCheck,
  Ban,
  Info,
  Loader2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import QRCode from 'react-qr-code'
import { MemoryGallery } from '@/components/memories'
import ReportModal from '@/components/ReportModal'
import { useTranslation } from 'react-i18next'

export default function TicketDetail() {
  const { t } = useTranslation()
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showReportModal, setShowReportModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false)

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsService.getTicketById(ticketId!),
    enabled: !!ticketId,
  })

  // Refund preview query (only fetched when cancel confirm dialog opens)
  const { data: refundPreview, isLoading: isRefundPreviewLoading } = useQuery({
    queryKey: ['refundPreview', ticketId],
    queryFn: () => ticketsService.getRefundPreview(ticketId!),
    enabled: !!ticketId && showCancelConfirm,
  })

  // Cancel ticket mutation
  const cancelMutation = useMutation({
    mutationFn: (data: { ticketId: string; reason?: string }) =>
      ticketsService.cancelTicket(data.ticketId, data.reason),
    onSuccess: () => {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'ticket_cancel', ticket_id: ticketId })
      toast({ title: t('tickets.cancelSuccess') })
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setShowCancelConfirm(false)
      navigate('/my-tickets')
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('tickets.cancelError'),
      })
    },
  })

  const handleShare = async () => {
    if (!ticket) return

    const eventObj = typeof ticket.event === 'object' ? ticket.event : null
    const eventId = eventObj ? (eventObj._id || eventObj.id) : ''
    const url = eventId ? `https://app.shareyourparty.de/redirect/event/${eventId}` : window.location.href
    const text = `Mein Ticket für ${eventObj?.name || 'Event'}`

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url)
      toast({ title: t('common.linkCopied') })
    }
  }

  const handleDownload = () => {
    // Download QR code as image
    const svg = document.getElementById('ticket-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new window.Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `ticket-${ticketId}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleContactHost = () => {
    if (!ticket) return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'contact_host', ticket_id: ticketId })
    const organizerId = ticket.organizerId || (typeof ticket.event === 'object' ? ((ticket.event as any).userId?._id || (ticket.event as any).userId) : null)
    if (organizerId) {
      const currentUserId = user?._id || user?.id
      if (currentUserId) {
        const roomId = `${organizerId}_${currentUserId}`
        navigate(`/chat/${roomId}`)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-6" />
          <div className="h-64 bg-muted rounded-lg mb-4" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Ticket nicht gefunden</h2>
        <p className="text-muted-foreground mb-8">
          Das Ticket existiert nicht oder wurde storniert.
        </p>
        <Button onClick={() => navigate('/my-tickets')}>Zu meinen Tickets</Button>
      </div>
    )
  }

  const event = typeof ticket.event === 'object' ? ticket.event : null
  const isValid = ticket.status === 'valid' || ticket.status === 'active'
  const isUsed = ticket.status === 'used' || ticket.isScanned
  const isCancelled = ticket.status === 'cancelled' || ticket.status === 'refunded'

  // Check if ticket can be cancelled (same logic as mobile app)
  const isPastEvent = event ? new Date(event.eventDate) < new Date() : false
  const eventStartTime = event?.eventStartTime ? new Date(event.eventStartTime) : null
  const canCancelTicket =
    isValid &&
    !isUsed &&
    !isCancelled &&
    !ticket.isScanned &&
    !isPastEvent &&
    (!eventStartTime || eventStartTime > new Date())

  // Reason why cancellation is not possible (for user feedback)
  const getCancelDisabledReason = (): string | null => {
    if (isCancelled) return null // Don't show button at all
    if (ticket.isScanned) return t('tickets.cancelDisabledScanned')
    if (isUsed) return t('tickets.cancelDisabledUsed')
    if (isPastEvent) return t('tickets.cancelDisabledPastEvent')
    if (eventStartTime && eventStartTime <= new Date()) return t('tickets.cancelDisabledEventStarted')
    if (!isValid) return t('tickets.cancelDisabledInvalid')
    return null
  }
  const cancelDisabledReason = getCancelDisabledReason()

  // Check if current user is the organizer
  const organizerId = ticket.organizerId || (event ? ((event as any).userId?._id || (event as any).userId) : null)
  const currentUserId = user ? (user._id || user.id) : null
  const isOrganizer = !!(currentUserId && organizerId && currentUserId === (typeof organizerId === 'string' ? organizerId : (organizerId as any)?._id))

  // Event has started (for memories)
  const eventHasStarted = event ? new Date(event.eventDate) <= new Date() : false

  // Organizer display info
  const organizerName = event && typeof (event as any).userId === 'object' ? (event as any).userId.name : null
  const organizerProfileImage = event && typeof (event as any).userId === 'object' ? (event as any).userId.profileImage : null
  const organizerUserId = event && typeof (event as any).userId === 'object' ? (event as any).userId._id : (event as any)?.userId

  const getStatusInfo = () => {
    if (isCancelled) {
      return {
        icon: <XCircle className="h-6 w-6 text-red-500" />,
        text: t('tickets.cancelled'),
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950',
      }
    }
    if (isUsed) {
      return {
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        text: t('tickets.used'),
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
      }
    }
    return {
      icon: <AlertCircle className="h-6 w-6 text-blue-500" />,
      text: t('tickets.valid'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    }
  }

  const statusInfo = getStatusInfo()

  // Build QR code value matching mobile app format
  const qrValue = JSON.stringify({
    ticketId: ticket._id || ticket.id,
    userId: ticket.userId || (typeof ticket.user === 'string' ? ticket.user : (ticket.user as any)?._id),
    eventId: ticket.eventId || (event ? (event._id || event.id) : ''),
    verificationCode: ticket.verificationCode || '',
  })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      {/* Ticket Card */}
      <Card className="overflow-hidden">
        {/* Event Header Image */}
        {event && (
          <div className="relative h-40 bg-gradient-to-r from-purple-600 to-pink-600">
            {(event.locationImages?.[0]?.url || event.thumbnailUrl) && (
              <img
                src={resolveImageUrl(event.locationImages?.[0]?.url || event.thumbnailUrl)}
                alt={event.name}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Ticket className="h-8 w-8 mx-auto mb-2" />
                <h1 className="text-xl font-bold">{event.name}</h1>
              </div>
            </div>
          </div>
        )}

        <CardContent className="space-y-6 p-6">
          {/* Status Badge */}
          <div className={cn('flex items-center justify-center gap-2 p-3 rounded-lg', statusInfo.bgColor)}>
            {statusInfo.icon}
            <span className={cn('font-semibold', statusInfo.color)}>{statusInfo.text}</span>
          </div>

          {/* Scanned Badge (like mobile app) */}
          {ticket.isScanned && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('tickets.scanned')}</p>
                {ticket.scannedAt && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {format(new Date(ticket.scannedAt), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QR Code - matching mobile app format (show for all active/scanned tickets, hide only for cancelled) */}
          {!isCancelled && (
            <div className="flex flex-col items-center py-6">
              <p className="text-sm font-medium mb-4">Dein Ticket QR-Code</p>
              <div className="p-4 bg-white rounded-lg shadow-lg">
                {ticket.qrCode && ticket.qrCode.startsWith('data:image') ? (
                  // Backend-generated base64 QR (same as mobile)
                  <img
                    src={ticket.qrCode}
                    alt="Ticket QR Code"
                    className="w-[250px] h-[250px] object-contain"
                  />
                ) : (
                  // Client-side fallback with JSON data (same as mobile)
                  <QRCode
                    id="ticket-qr-code"
                    value={qrValue}
                    size={250}
                    level="H"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {t('tickets.showQR')}
              </p>
            </div>
          )}

          {/* Event Details */}
          {event && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>
                  {format(new Date(event.eventDate), 'EEEE, d. MMMM yyyy', { locale: de })}
                </span>
              </div>
              {event.eventStartTime && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span>
                    {event.eventStartTime}
                    {event.eventEndTime && ` - ${event.eventEndTime}`} Uhr
                  </span>
                </div>
              )}
              {event.locationName && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span>{event.locationName}</span>
                </div>
              )}
              {event.restrictions && (
                <div className="flex items-start gap-3">
                  <Ban className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    {typeof event.restrictions === 'string' ? event.restrictions : (event.restrictions as string[]).join(', ')}
                  </span>
                </div>
              )}
              {event.description && (
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{event.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Organizer (like mobile app) */}
          {organizerName && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveImageUrl(organizerProfileImage)} />
                <AvatarFallback className="gradient-bg text-white text-sm">
                  {getInitials(organizerName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Veranstalter</p>
                <Link to={`/user/${organizerUserId}`} className="font-medium text-primary hover:underline">
                  {organizerName}
                </Link>
              </div>
            </div>
          )}

          {/* Ticket Info */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ticket-ID</span>
              <span className="font-mono">{(ticket._id || ticket.id || '').slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Anzahl</span>
              <span>{ticket.quantity || 1}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preis</span>
              <span>{formatPrice(ticket.totalAmount || ticket.price || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gekauft am</span>
              <span>{format(new Date(ticket.purchaseDate || ticket.createdAt), 'dd.MM.yyyy', { locale: de })}</span>
            </div>
          </div>

          {/* Safety Companion Hint (like mobile app) */}
          <Link to="/safety-companions" className="block">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors cursor-pointer">
              <ShieldCheck className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Sicher mit einem Begleiter
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  Deine Sicherheit ist uns wichtig! Mit dem Safety-Companion-Feature kannst du eine Vertrauensperson informieren. Nur Personen mit gültigem Ticket für dasselbe Event können als Begleiter hinzugefügt werden.
                </p>
              </div>
            </div>
          </Link>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* Download & Share */}
            <div className="flex gap-2">
              {isValid && !isUsed && !isCancelled && (
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                {t('common.share')}
              </Button>
            </div>

            {/* Contact Host (like mobile app) */}
            {!isOrganizer && organizerId && (
              <Button variant="outline" className="w-full" onClick={handleContactHost}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('tickets.contactHost')}
              </Button>
            )}

            {/* Cancellation Policy Info (like mobile app) */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowCancellationPolicy(true)}
            >
              <Info className="h-4 w-4 mr-2" />
              {t('tickets.cancellationPolicy')}
            </Button>

            {/* Cancel Ticket (like mobile app) - Always visible unless already cancelled */}
            {!isCancelled && (
              <div className="space-y-1">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={!canCancelTicket}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('tickets.cancelTicket')}
                </Button>
                {cancelDisabledReason && (
                  <p className="text-xs text-muted-foreground text-center">
                    {cancelDisabledReason}
                  </p>
                )}
              </div>
            )}

            {/* Report Event (like mobile app) */}
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => setShowReportModal(true)}
            >
              <Flag className="h-4 w-4 mr-2" />
              {t('events.report')}
            </Button>
          </div>

          {/* Event Link */}
          {event && (event._id || event.id) && (
            <Link to={`/event/${event._id || event.id}`}>
              <Button variant="secondary" className="w-full">
                Event-Details anzeigen
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Memories Section (like mobile app - only after event started) */}
      {eventHasStarted && event && (ticket._id || ticket.id) && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Erinnerungen</h2>
            </div>
            <MemoryGallery
              ticketId={(ticket._id || ticket.id)!}
              eventId={(event._id || event.id)!}
              eventStartDate={event.eventDate}
              canUpload={isValid && !isCancelled}
            />
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog (like mobile app with refund preview) */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCancelConfirm(false)}
        >
          <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold">{t('tickets.cancelTitle')}</h3>

              {isRefundPreviewLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">{t('tickets.calculatingRefund')}</span>
                </div>
              ) : refundPreview ? (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    Möchtest du dein Ticket für <strong>{event?.name}</strong> wirklich stornieren?
                  </p>
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-sm">
                      <span>Erstattungsbetrag:</span>
                      <span className="font-bold text-green-600">{formatPrice(refundPreview.refundAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Bezahlt:</span>
                      <span>{formatPrice(refundPreview.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Gebühren:</span>
                      <span>{formatPrice(refundPreview.fee)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Die Erstattung erfolgt innerhalb von 5-10 Werktagen.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Möchtest du dein Ticket für <strong>{event?.name}</strong> wirklich stornieren?
                  Die Erstattung erfolgt innerhalb von 5-10 Werktagen.
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  {t('common.no')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => cancelMutation.mutate({ ticketId: ticket._id || ticket.id || '' })}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {t('tickets.confirmCancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancellation Policy Info Dialog (like mobile app) */}
      {showCancellationPolicy && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCancellationPolicy(false)}
        >
          <Card className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold">{t('tickets.cancellationPolicy')}</h3>
              <div className="space-y-3 text-sm">
                <p>{t('tickets.cancelAnytime')}</p>
                <div className="space-y-1">
                  <p className="text-green-600">&#10003; Volle Erstattung garantiert</p>
                  <p className="text-green-600">&#10003; Keine Stornierungsgebühren</p>
                  <p className="text-green-600">&#10003; Erstattung innerhalb von 5-10 Werktagen</p>
                </div>
                <div className="space-y-1 text-muted-foreground">
                  <p>Stornierung nicht möglich wenn:</p>
                  <p>&bull; Das Event bereits begonnen hat</p>
                  <p>&bull; Das Ticket bereits gescannt wurde</p>
                  <p>&bull; Das Ticket bereits storniert wurde</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => setShowCancellationPolicy(false)}>
                {t('common.understood')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Event Modal */}
      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="event"
        eventId={event ? (event._id || event.id) : undefined}
      />
    </div>
  )
}
