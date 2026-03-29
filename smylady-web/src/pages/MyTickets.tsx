import { useQuery } from '@tanstack/react-query'
import { ticketsService } from '@/services/tickets'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatPrice, formatEventTime, resolveImageUrl } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Ticket, Calendar, MapPin, QrCode, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function MyTickets() {
  const { t } = useTranslation()
  const [showPast, setShowPast] = useState(false)

  const { data: upcomingTickets, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['tickets', 'upcoming'],
    queryFn: () => ticketsService.getUpcomingTickets(),
  })

  const { data: pastTickets, isLoading: loadingPast } = useQuery({
    queryKey: ['tickets', 'past'],
    queryFn: () => ticketsService.getPastTickets(),
    enabled: showPast,
  })

  const tickets = showPast ? pastTickets : upcomingTickets
  const isLoading = showPast ? loadingPast : loadingUpcoming

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tickets.myTickets')}</h1>
          <p className="text-muted-foreground">{t('tickets.manageTickets')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={!showPast ? 'default' : 'outline'}
          onClick={() => setShowPast(false)}
        >
          {t('tickets.upcomingEvents')}
        </Button>
        <Button
          variant={showPast ? 'default' : 'outline'}
          onClick={() => setShowPast(true)}
        >
          {t('tickets.pastEvents')}
        </Button>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            // Backend can return event as "event" OR "eventId" (populated)
            const eventData = ticket.event || (ticket as any).eventId
            const event = eventData && typeof eventData !== 'string' ? eventData : null
            
            return (
              <Card key={ticket.id || ticket._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Event Image */}
                    {event && (
                      <div className="w-full md:w-48 h-32 md:h-auto bg-muted">
                        <img
                          src={resolveImageUrl(event.thumbnailUrl || event.locationImages?.[0]?.url || event.images?.[0]) || 'https://via.placeholder.com/200x150?text=Event'}
                          alt={event.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=Event'
                          }}
                        />
                      </div>
                    )}

                    {/* Ticket Info */}
                    <div className="flex-1 p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {event?.name || 'Event'}
                        </h3>
                        {event && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(event.eventDate)} {t('time.at')} {formatEventTime(event.eventStartTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.locationName}</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === 'valid'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : ticket.status === 'used'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {ticket.status === 'valid' ? t('tickets.valid') :
                             ticket.status === 'used' ? t('tickets.used') :
                             ticket.status === 'cancelled' ? t('tickets.cancelled') : t('tickets.refunded')}
                          </span>
                          <span className="text-sm font-medium">
                            {formatPrice(ticket.totalAmount || ticket.price)}
                          </span>
                        </div>
                      </div>

                      {/* QR Code / Actions */}
                      <div className="flex items-center gap-3">
                        {ticket.status === 'valid' && (
                          <Link to={`/ticket/${ticket._id || ticket.id}`}>
                            <Button variant="outline" className="gap-2">
                              <QrCode className="h-4 w-4" />
                              QR-Code
                            </Button>
                          </Link>
                        )}
                        {event && (
                          <Link to={`/event/${event.id || event._id}`}>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="h-5 w-5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {showPast ? t('tickets.noPastTickets') : t('tickets.noTickets')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {showPast
              ? t('tickets.noPastVisited')
              : t('tickets.noPurchased')}
          </p>
          <Link to="/explore">
            <Button variant="gradient">{t('tickets.discoverEvents')}</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
