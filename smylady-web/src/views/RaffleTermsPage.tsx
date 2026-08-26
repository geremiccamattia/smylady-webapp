'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { eventsService } from '@/services/events'
import { useLocalePath } from '@/hooks/useLocalePath'
import { buildRaffleTerms } from '@/lib/raffleTerms'

interface RaffleTermsPageProps {
  /** Slug bzw. ID aus der URL — exakt der Wert, der auch die Event-Detailseite lädt. */
  eventSlug: string
}

export default function RaffleTermsPage({ eventSlug }: RaffleTermsPageProps) {
  const { t, i18n } = useTranslation()
  const localePath = useLocalePath()

  // Bewusst der öffentliche Endpoint: Teilnahmebedingungen müssen auch ohne Login
  // (und für Suchmaschinen) erreichbar sein.
  const { data: event, isLoading } = useQuery({
    queryKey: ['publicEvent', eventSlug],
    queryFn: () => eventsService.getPublicEventById(eventSlug),
    enabled: !!eventSlug,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!event || !event.isRaffle) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p className="text-muted-foreground">
          {t('raffleTerms.notFound', { defaultValue: 'Dieses Event ist kein Gewinnspiel.' })}
        </p>
        {event && (
          <Link
            href={localePath(`/event/${eventSlug}`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('raffleTerms.backToEvent', { defaultValue: 'Zurück zum Event' })}
          </Link>
        )}
      </div>
    )
  }

  // Der gesamte Text entsteht in lib/raffleTerms — hier bleibt nur das Markup.
  const terms = buildRaffleTerms(event, t, i18n.language)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Zurück zum Event */}
      <Link
        href={localePath(`/event/${eventSlug}`)}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('raffleTerms.backToEvent', { defaultValue: 'Zurück zum Event' })}
      </Link>

      <h1 className="text-3xl font-bold mb-2">{terms.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{terms.subtitle}</p>

      <div className="space-y-6 text-foreground">
        {terms.sections.map((section) => (
          <section key={section.number} className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">
              {section.number}. {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`text-muted-foreground leading-relaxed${index > 0 ? ' mt-3' : ''}`}
              >
                {paragraph.kind === 'privacyLink' ? (
                  <Link href={localePath('/privacy')} className="text-primary underline">
                    {paragraph.text}
                  </Link>
                ) : (
                  paragraph.text
                )}
              </p>
            ))}
          </section>
        ))}

        <section className="pt-2">
          <p className="text-sm text-muted-foreground">{terms.footer}</p>
        </section>
      </div>
    </div>
  )
}
