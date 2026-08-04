'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocalePath'
import { Card, CardContent } from '@/components/ui/card'
import { resolveImageUrl, generateEventSlug } from '@/lib/utils'
import { Gift, Users, Calendar, MapPin } from 'lucide-react'

interface RaffleEventCardProps {
  event: any
}

export function RaffleEventCard({ event }: RaffleEventCardProps) {
  const { t } = useTranslation()
  const localePath = useLocalePath()

  const eventImage = event.locationImages?.[0]?.url
  const slug = generateEventSlug(event.name, event._id)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Link href={localePath(`/event/${slug}`)}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full border-2 border-amber-200 dark:border-amber-800">
        {/* Bild mit Gewinnspiel-Badge */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {eventImage ? (
            <img
              src={resolveImageUrl(eventImage)}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <Gift className="h-12 w-12 text-amber-500" />
            </div>
          )}
          {/* Gewinnspiel-Badge */}
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            🎰 {t('raffle.badge', { defaultValue: 'Gewinnspiel' })}
          </div>
          {/* Teilnehmer-Count */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.soldTickets || 0}
          </div>
          {/* KI-Badge — oben rechts, da unten bereits Gewinnspiel-Badge und
              Teilnehmer-Count sitzen */}
          {event.isAiGenerated && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5">
              🤖 {t('common.aiShort', { defaultValue: 'KI' })}
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-1">{event.name}</h3>

          {/* Gewinn */}
          {event.rafflePrize && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Gift className="h-3.5 w-3.5" />
              <span className="text-xs font-medium line-clamp-1">
                {t('raffle.prize', { defaultValue: 'Gewinn' })}: {event.rafflePrize}
              </span>
            </div>
          )}

          {/* Datum + Ort */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.eventDate)}
            </span>
            {event.locationName && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {event.locationName.split(',')[0]}
              </span>
            )}
          </div>

          {/* Status */}
          {event.raffleStatus === 'completed' && (
            <div className="text-xs text-green-600 font-medium">
              ✓ {t('raffle.completed', { defaultValue: 'Gewinner gezogen' })}
            </div>
          )}
          {event.raffleStatus === 'drawing' && (
            <div className="text-xs text-amber-600 font-medium animate-pulse">
              🎰 {t('raffle.drawing', { defaultValue: 'Ziehung läuft...' })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
