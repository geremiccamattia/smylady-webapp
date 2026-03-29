import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import EventCard from '@/components/events/EventCard'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, PartyPopper } from 'lucide-react'

export default function MyEvents() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', 'my-events'],
    queryFn: () => eventsService.getMyEvents(),
  })

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
          {events.map((event) => (
            <EventCard key={event.id || event._id} event={event} />
          ))}
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
    </div>
  )
}
