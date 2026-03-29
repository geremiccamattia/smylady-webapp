import { useQuery } from '@tanstack/react-query'
import { favoritesService } from '@/services/favorites'
import EventCard from '@/components/events/EventCard'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Favorites() {
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getFavorites(),
  })

  const handleFavoriteChange = () => {
    refetch()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Favoriten</h1>
        <p className="text-muted-foreground">Deine gespeicherten Events</p>
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
            <EventCard 
              key={event.id || event._id} 
              event={{ ...event, isFavorite: true }}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Keine Favoriten</h3>
          <p className="text-muted-foreground mb-4">
            Du hast noch keine Events als Favorit gespeichert.
          </p>
          <Link to="/explore">
            <Button variant="gradient">Events entdecken</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
