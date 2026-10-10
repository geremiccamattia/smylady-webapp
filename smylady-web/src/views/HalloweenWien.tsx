'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocalePath'
import { MapPin } from 'lucide-react'
import {
  EVENT_ROWS,
  FAQS,
  FAQ_HEADING,
  HEADLINE,
  INTRO,
  OUTRO,
  OUTRO_HEADING,
  SECTIONS,
  TABLE_HEADERS,
  TABLE_HEADING,
  TABLE_NOTE,
  TIPS,
  TIPS_HEADING,
  UPDATED_NOTE,
} from '@/lib/halloweenWien'

/*
 * Die Seite rendert nur — sämtliche Texte liegen in lib/halloweenWien.ts, damit
 * sich die Liste aktualisieren lässt, ohne diese Datei anzufassen. Strukturierte
 * Daten und Metadaten stehen in den beiden page.tsx (serverseitig).
 */

/** Wandelt **fett** in <strong>. Reicht für die paar Hervorhebungen im Text. */
function renderBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
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

export default function HalloweenWien() {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'de'
  const localePath = useLocalePath()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Kopf */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Österreich · Wien</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">{HEADLINE[locale]}</h1>
        {INTRO[locale].map((paragraph, index) => (
          <p key={index} className="text-muted-foreground text-lg mb-3">
            {renderBold(paragraph)}
          </p>
        ))}
        <p className="text-sm text-muted-foreground italic">{UPDATED_NOTE[locale]}</p>
      </div>

      {/* Übersichtstabelle */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{TABLE_HEADING[locale]}</h2>

        {/* Eigener Scrollbereich: Die Tabelle hat fünf Spalten und würde das
            Layout auf dem Handy sonst seitlich aufziehen. */}
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {TABLE_HEADERS[locale].map(header => (
                  <th key={header} className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENT_ROWS.map((row, index) => (
                <tr key={row.name} className={`border-t ${index % 2 === 1 ? 'bg-muted/20' : ''}`}>
                  <td className="px-4 py-3 align-top font-medium">
                    {/*
                      * Aktuell hat jede Zeile eine Eventseite. Der Textfall
                      * bleibt stehen, damit sich später ein Event ohne eigene
                      * Detailseite ergänzen lässt.
                      */}
                    {row.eventUrl ? (
                      <Link href={localePath(row.eventUrl)} className="text-primary hover:underline">
                        {row.name}
                      </Link>
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{row.location}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                    {row.start[locale]}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{row.music[locale]}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                    {row.price[locale]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground italic mt-3">{TABLE_NOTE[locale]}</p>
      </section>

      {/* Abschnitte nach Musikrichtung */}
      {SECTIONS.map(section => (
        <section key={section.id} className="mb-12">
          <h2 className="text-xl font-semibold mb-6">{section.heading[locale]}</h2>

          <div className="space-y-8">
            {section.entries.map(entry => (
              <article key={entry.id}>
                <h3 className="text-lg font-semibold mb-2">{entry.heading[locale]}</h3>
                {entry.paragraphs[locale].map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground mb-3">
                    {renderBold(paragraph)}
                  </p>
                ))}
                {entry.eventUrl && entry.linkLabel && (
                  <Link
                    href={localePath(entry.eventUrl)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    → {entry.linkLabel[locale]}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Tipps */}
      <section className="border-t pt-8 mb-12">
        <h2 className="text-xl font-semibold mb-6">{TIPS_HEADING[locale]}</h2>
        <div className="space-y-4">
          {TIPS.map(tip => (
            <p key={tip.id} className="text-muted-foreground">
              <strong className="text-foreground">{tip.title[locale]}</strong> {tip.text[locale]}
              {tip.link && (
                <>
                  {' '}
                  <a
                    href={tip.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {tip.link.label[locale]}
                  </a>
                  .
                </>
              )}
            </p>
          ))}
        </div>
      </section>

      {/* FAQ — Texte aus lib/halloweenWien.ts, dieselbe Quelle wie das FAQPage-Schema */}
      <section className="border-t pt-8 mb-12">
        <h2 className="text-xl font-semibold mb-6">{FAQ_HEADING[locale]}</h2>
        <div className="space-y-3">
          {FAQS[locale].map((faq, index) => (
            <FaqItem key={index} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {/* Abschluss */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">{OUTRO_HEADING[locale]}</h2>
        <p className="text-muted-foreground mb-3">
          {OUTRO[locale].listText}{' '}
          <Link href={localePath('/explore')} className="text-primary hover:underline">
            {OUTRO[locale].listLinkLabel}
          </Link>
          .
        </p>
        <p className="text-muted-foreground">
          {OUTRO[locale].organizerText}{' '}
          <Link href={localePath('/veranstalter')} className="text-primary hover:underline">
            {OUTRO[locale].organizerLinkLabel}
          </Link>{' '}
          {locale === 'en'
            ? 'and reach Vienna’s party community.'
            : 'und erreiche die Wiener Party-Community.'}
        </p>
      </section>
    </div>
  )
}
