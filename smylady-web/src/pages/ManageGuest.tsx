import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Users, Download, User, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { manageGuestService } from '@/services/manageGuest'
import { eventsService } from '@/services/events'
import { resolveImageUrl } from '@/lib/utils'

export default function ManageGuest() {
  const { t } = useTranslation()
  const { eventId } = useParams<{ eventId: string }>()

  // Fetch guest list
  const {
    data: guestList = [],
    isLoading,
  } = useQuery({
    queryKey: ['guestList', eventId],
    queryFn: () => manageGuestService.getGuestList(eventId!),
    enabled: !!eventId,
  })

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventById(eventId!),
    enabled: !!eventId,
  })

  const hasGuests = guestList.length > 0
  const totalTickets = event?.totalTickets || 0
  const acceptedBookings = guestList.length
  const bookedPercent = totalTickets > 0 ? (acceptedBookings / totalTickets) * 100 : 0
  const remainingPercent = 100 - bookedPercent

  const handleExportCSV = async () => {
    if (!eventId) return
    try {
      const blob = await manageGuestService.exportGuestListCSV(eventId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `guest-list-${eventId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to={eventId ? `/event/${eventId}` : '/my-events'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('manageGuests.title', { defaultValue: 'Gästeliste' })}
          </h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={eventId ? `/event/${eventId}` : '/my-events'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('manageGuests.title', { defaultValue: 'Gästeliste' })}
          </h1>
        </div>
        {hasGuests && (
          <div className="flex gap-2">
            <Link to={`/scan/${eventId}/statistics`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('manageGuests.statistics', { defaultValue: 'Statistik' })}
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        )}
      </div>

      {/* Stats Card */}
      {hasGuests && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {bookedPercent.toFixed(0)}% {t('manageGuests.book', { defaultValue: 'gebucht' })}
              </p>
              <p className="text-white/80">
                {remainingPercent.toFixed(0)}% {t('manageGuests.remaining', { defaultValue: 'verfügbar' })}
              </p>
              {event?.price !== undefined && event.price > 0 && (
                <p className="text-white/80 mt-1">
                  {t('manageGuests.total', { defaultValue: 'Gesamt:' })}{' '}
                  {(event.price * guestList.length).toFixed(2)} €
                </p>
              )}
            </div>
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${bookedPercent * 2.2} 220`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {bookedPercent.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={bookedPercent} className="h-2 bg-white/30" />
            <p className="text-sm text-white/80 mt-1">
              {acceptedBookings} / {totalTickets} {t('manageGuests.tickets', { defaultValue: 'Tickets' })}
            </p>
          </div>
        </div>
      )}

      {/* Guest List */}
      {!hasGuests ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('events.noGuests')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {guestList.map((guest) => (
            <div
              key={guest._id}
              className="bg-card border rounded-lg p-4 flex items-center gap-4"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={resolveImageUrl(guest.userId?.profileImage)} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{guest.userId?.name || 'Gast'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('manageGuests.date', { defaultValue: 'Gekauft:' })}{' '}
                  {format(new Date(guest.purchasedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    guest.status === 'used'
                      ? 'bg-green-100 text-green-700'
                      : guest.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {guest.status === 'used'
                    ? t('manageGuests.used', { defaultValue: 'Eingelöst' })
                    : guest.status === 'cancelled'
                    ? t('manageGuests.cancelled', { defaultValue: 'Storniert' })
                    : t('manageGuests.active', { defaultValue: 'Aktiv' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
