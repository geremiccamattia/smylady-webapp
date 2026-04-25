import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import EventCard from '@/components/events/EventCard'
import BoostModal from '@/components/events/BoostModal'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, PartyPopper, Zap } from 'lucide-react'
import { Event } from '@/types'

export default function MyEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', 'my-events'],
    queryFn: () => eventsService.getMyEvents(),
  })

  const [boostTarget, setBoostTarget] = useState<{
    id: string
    name: string
    boostStatus?: string
    boostBudget?: number
    boostDailyBudget?: number
    boostEndDate?: string
    boostRadius?: number
    boostImpressions?: number
  } | null>(null)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meine Events</h1>
          <p className="text-muted-foreground">Events die du erstellt hast</p>
        </div>
        <Link to="/create-event">
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            Event erstellen
          </Button>
        </Link>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: Event) => {
            const eventId = event.id || event._id!
            return (
              <div key={eventId} className="flex flex-col gap-2">
                <EventCard event={event} />
                {new Date(event.eventStartTime || event.eventDate) > new Date() && (
                  <Button
                    variant={event.boostStatus === 'active' ? 'outline' : 'ghost'}
                    size="sm"
                    className="gap-2 text-amber-500 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    onClick={() => setBoostTarget({
                      id: eventId,
                      name: event.name,
                      boostStatus: event.boostStatus,
                      boostBudget: event.boostBudget,
                      boostDailyBudget: event.boostDailyBudget,
                      boostEndDate: event.boostEndDate,
                      boostRadius: event.boostRadius,
                      boostImpressions: event.boostImpressions,
                    })}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {event.boostStatus === 'active' ? 'Boost aktiv' : 'Event boosten'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <PartyPopper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Noch keine Events</h3>
          <p className="text-muted-foreground mb-4">
            Du hast noch keine Events erstellt.
          </p>
          <Link to="/create-event">
            <Button variant="gradient" className="gap-2">
              <Plus className="h-4 w-4" />
              Erstes Event erstellen
            </Button>
          </Link>
        </div>
      )}

      {boostTarget && (
        <BoostModal
          eventId={boostTarget.id}
          eventName={boostTarget.name}
          boostStatus={boostTarget.boostStatus}
          boostBudget={boostTarget.boostBudget}
          boostDailyBudget={boostTarget.boostDailyBudget}
          boostEndDate={boostTarget.boostEndDate}
          boostRadius={boostTarget.boostRadius}
          boostImpressions={boostTarget.boostImpressions}
          open={true}
          onClose={() => setBoostTarget(null)}
        />
      )}
    </div>
  )
}
