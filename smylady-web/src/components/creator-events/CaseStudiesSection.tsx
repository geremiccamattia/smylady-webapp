'use client'

import { useTranslation } from 'react-i18next'
import type { CaseStudy } from '@/services/cases'
import CaseReel from './CaseReel'

/**
 * Case Studies aus der WordPress-Instanz (Post-Type `cases`).
 *
 * Die Daten holt die server-seitige page.tsx über fetchCaseStudiesSafe() und
 * reicht sie als Prop durch — CreatorEventsPage ist eine Client-Komponente und
 * darf nicht selbst am CMS hängen.
 *
 * 'use client' ist nötig, weil die Überschriften wie auf der übrigen Seite über
 * useTranslation laufen. Die Prop ist rein serialisierbar, der Übergang von der
 * Server-Komponente ist also unproblematisch.
 */

interface CaseStudiesSectionProps {
  cases: CaseStudy[]
}

export default function CaseStudiesSection({ cases }: CaseStudiesSectionProps) {
  const { t } = useTranslation()

  // Kein Abschnitt ohne Inhalt — auch der Fehlerfall aus fetchCaseStudiesSafe
  // landet hier als leeres Array.
  if (!cases || cases.length === 0) return null

  return (
    <section className="mt-20 px-2 max-w-6xl mx-auto">
      <p className="text-center text-[13px] font-black uppercase tracking-wide text-[#e9548c] mb-3">
        {t('influencerEvents.casesEyebrow', { defaultValue: 'Unsere Arbeit' })}
      </p>
      <h2 className="text-center text-3xl md:text-4xl font-black leading-[1.1] tracking-tight mb-10">
        {t('influencerEvents.casesHeadline', {
          defaultValue: 'Creator im Einsatz',
        })}
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((entry) => (
          <article
            key={entry.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            {entry.reelShortcode && (
              <CaseReel shortcode={entry.reelShortcode} title={entry.title} />
            )}

            <div className="mt-4 flex flex-1 flex-col min-w-0">
              {/*
               * Der Kundenname wird bewusst nicht angezeigt. `entry.client` bleibt
               * in services/cases.ts erhalten (Feld `kunde`), damit die Zeile ohne
               * erneute Datenarbeit wieder eingeblendet werden kann.
               *
               * Ohne die Zeile darüber ist die Überschrift das erste Kind des
               * Flex-Containers — das mt-1 entfällt deshalb, sonst bliebe der
               * Abstand der entfernten Zeile als Leerraum stehen.
               */}
              <h3 className="text-lg font-bold break-words">{entry.title}</h3>

              {entry.metrics.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {entry.metrics.map((metric, index) => (
                    <li
                      key={`${entry.id}-${index}`}
                      className="rounded-full bg-[#FDF2F7] px-3 py-1 text-xs font-medium text-[#9d2f5c]"
                    >
                      {metric}
                    </li>
                  ))}
                </ul>
              )}

              {entry.reelUrl && (
                <a
                  href={entry.reelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm font-medium text-[#e9548c] hover:underline break-words"
                >
                  {t('influencerEvents.casesInstagramLink', {
                    defaultValue: 'Original auf Instagram ansehen →',
                  })}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
