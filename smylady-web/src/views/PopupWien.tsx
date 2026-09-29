'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { eventsService } from '@/services/events'
import EventCard from '@/components/events/EventCard'
import { useLocalePath } from '@/hooks/useLocalePath'
import {
  BREADCRUMB,
  CTA,
  CTA_HREF,
  FAQS,
  FAQ_HEADING,
  FORMATS,
  FORMATS_HEADING,
  HEADLINE,
  INTRO,
  INTRO_LINK,
  LIST_EMPTY,
  LIST_HEADING,
  POPUP_CATEGORY,
  selectRunningAndUpcoming,
  type PageLocale,
  type PopupEvent,
} from '@/lib/popupWien'

/*
 * Diese Ansicht rendert KEIN JSON-LD.
 *
 * Die strukturierten Daten stehen serverseitig in der page.tsx
 * (lib/popupWienSchema.ts, ausgegeben über components/seo/JsonLd.tsx). Die
 * älteren Kategorieseiten — Konzerte, Workshops, Clubbing — injizieren ihr
 * Schema noch per useEffect im Client; im initialen HTML steht davon nichts,
 * und genau das lesen die meisten Crawler.
 */

/**
 * Setzt einen internen Link an der Stelle `{link}` in den Text ein.
 *
 * Die Texte stehen als ganze Sätze in lib/popupWien.ts, damit sie
 * redaktionell lesbar bleiben und nicht in Fragmente zerfallen. Fehlt der
 * Platzhalter oder der Link, wird der Text unverändert ausgegeben.
 */
function TextWithLink({
  text,
  href,
  label,
}: {
  text: string
  href?: string
  label?: string
}) {
  const [before, ...rest] = text.split('{link}')
  if (!href || !label || rest.length === 0) {
    return <>{text.replace('{link}', label ?? '')}</>
  }

  return (
    <>
      {before}
      <Link href={href} className="text-primary hover:underline">
        {label}
      </Link>
      {rest.join('{link}')}
    </>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span className={`ml-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-muted-foreground">{answer}</div>}
    </div>
  )
}

export default function PopupWien() {
  const { i18n } = useTranslation()
  const locale: PageLocale = i18n.language.startsWith('en') ? 'en' : 'de'
  const localePath = useLocalePath()

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'pop-up-wien'],
    /*
     * upcoming = false, dann selbst filtern.
     *
     * Der Parameter der API kennt nur das Startdatum. Ein Pop-up, das seit dem
     * 1.10. läuft und bis zum 12.10. offen hat, fiele damit aus der Liste —
     * also genau das, was gerade zu sehen wäre.
     */
    queryFn: () =>
      eventsService.getPublicEvents(
        {
          latitude: '48.2092',
          longitude: '16.3728',
          radius: 30,
          category: POPUP_CATEGORY,
        },
        false,
      ),
  })

  const popups = useMemo(
    () => selectRunningAndUpcoming(events as PopupEvent[]),
    [events],
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Kopf: Breadcrumb, H1, Intro */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">
            {BREADCRUMB[locale].country} · {BREADCRUMB[locale].city} · {BREADCRUMB[locale].page}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-4">{HEADLINE[locale]}</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          <TextWithLink
            text={INTRO[locale]}
            href={localePath(INTRO_LINK.href)}
            label={INTRO_LINK.label[locale]}
          />
        </p>
      </div>

      {/*
        * Event-Liste vor den Textsektionen.
        *
        * Bewusst so weit oben: Sie ist der Grund, warum jemand auf der Seite
        * bleibt. Die Formaterklärungen stehen darunter.
        */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {LIST_HEADING[locale]}{' '}
          {!isLoading && (
            <span className="text-muted-foreground font-normal text-base">
              ({popups.length})
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : popups.length === 0 ? (
          <p className="text-muted-foreground">{LIST_EMPTY[locale]}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {popups.map(event => (
              <EventCard key={event._id || event.id} event={event as never} />
            ))}
          </div>
        )}
      </div>

      {/* Formatsektionen */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">{FORMATS_HEADING[locale]}</h2>

        <div className="space-y-8">
          {FORMATS.map(format => (
            <section key={format.id}>
              <h3 className="text-lg font-semibold mb-2">{format.heading[locale]}</h3>
              <p className="text-muted-foreground text-md">
                <TextWithLink
                  text={format.body[locale]}
                  href={format.link ? localePath(format.link.href) : undefined}
                  label={format.link?.label[locale]}
                />
              </p>
            </section>
          ))}
        </div>
      </div>

      {/* FAQ — Texte aus lib/popupWien.ts, dieselbe Quelle wie das FAQPage-Schema */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">{FAQ_HEADING[locale]}</h2>
        <div className="space-y-3">
          {FAQS[locale].map((faq, index) => (
            <FaqItem key={index} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-4">{CTA[locale].heading}</h2>
        <p className="text-muted-foreground text-md mb-4 max-w-3xl">{CTA[locale].body}</p>
        <Link
          href={localePath(CTA_HREF)}
          className="inline-flex items-center justify-center text-sm font-medium gradient-bg text-white hover:opacity-90 h-10 rounded-md px-6"
        >
          {CTA[locale].buttonLabel}
        </Link>
      </div>
    </div>
  )
}
