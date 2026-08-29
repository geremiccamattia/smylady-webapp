'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useRouter } from 'next/navigation'
import { publicClient } from '@/services/api'
import { generateEventSlug } from '@/lib/utils'
import { isRaffleOpen } from '@/lib/raffle'
import { X } from 'lucide-react'

export function RafflePromoBanner() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  // Beim Mount prüfen ob Banner schon geschlossen wurde (diese Session)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDismissed = sessionStorage.getItem('raffle_banner_dismissed')
      if (wasDismissed) setDismissed(true)
    }
  }, [])

  // Aktives Gewinnspiel laden
  const { data: raffleEvents } = useQuery({
    queryKey: ['activeRaffle'],
    queryFn: async () => {
      // /events ist auth-pflichtig (401 ohne Token) — für den Banner muss der
      // öffentliche Endpoint her, sonst sehen ausgeloggte Nutzer nie ein Gewinnspiel.
      // limit war 1: kam als einziges Ergebnis ein ausgelostes Gewinnspiel zurück,
      // blieb der Banner leer, obwohl noch offene existieren. Deshalb mehrere holen
      // und das erste offene nehmen.
      const response = await publicClient.get('/events/public', {
        params: { isRaffle: true, upcoming: true, limit: 5 },
      })
      return response.data?.data?.events || response.data?.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 Minuten cachen
  })

  const activeRaffle = (raffleEvents as any[] | undefined)?.find((e) => isRaffleOpen(e))

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('raffle_banner_dismissed', 'true')
    }
  }

  // Nicht anzeigen wenn: kein offenes Gewinnspiel oder Banner bereits geschlossen.
  // Ausgeloste sind oben schon herausgefiltert (isRaffleOpen).
  if (dismissed || !activeRaffle || !activeRaffle.name || !activeRaffle._id) {
    return null
  }

  // Event-Slug wie überall sonst (RaffleEventCard, EventCard) erzeugen
  const slug = generateEventSlug(activeRaffle.name, activeRaffle._id)
  const goToRaffle = () => router.push(localePath(`/event/${slug}`))

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 md:bottom-0">
      <div
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white cursor-pointer"
        onClick={goToRaffle}
      >
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg shrink-0">🎰</span>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm truncate">
                {activeRaffle.rafflePrize
                  ? t('raffle.promoPrize', {
                      prize: activeRaffle.rafflePrize,
                      defaultValue: `Gewinne: ${activeRaffle.rafflePrize}`,
                    })
                  : t('raffle.promoGeneric', { defaultValue: 'Gewinnspiel — Tolle Preise zu gewinnen!' })
                }
              </p>
              <p className="text-[10px] text-white/80 truncate hidden sm:block">
                {activeRaffle.name} · {t('raffle.promoFree', { defaultValue: 'Kostenlos teilnehmen' })}
              </p>
            </div>
          </div>
          <button
            className="shrink-0 bg-white text-amber-600 font-bold text-xs px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              goToRaffle()
            }}
          >
            {t('raffle.promoButton', { defaultValue: 'Teilnehmen →' })}
          </button>
          <button
            className="shrink-0 text-white/70 hover:text-white p-1"
            aria-label={t('common.close', { defaultValue: 'Schließen' })}
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
