'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { useLocalePath } from '@/hooks/useLocalePath'
import { tx, type MarketModel, type PageModel } from '@/lib/weihnachtenWien'
import type { ChristmasGroupId } from '@/lib/weihnachtenWienCuration'

/*
 * Rendert nur. Alle Inhalte — Zahlen, Zeiträume, Öffnungszeiten, FAQ — baut
 * lib/weihnachtenWien.ts auf dem Server, in Wiener Zeit und in der Sprache der
 * Route. Hier lebt nur der Filterzustand.
 */

type Filter = 'all' | ChristmasGroupId | 'more'

const APP_STORE_URL = 'https://apps.apple.com/at/app/share-your-party/id6748308083'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.shareyourparty.app'

function matches(market: MarketModel, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'more') return market.group === null
  return market.group === filter
}

function MarketCard({ market, href, locale }: { market: MarketModel; href: string; locale: PageModel['locale'] }) {
  return (
    <article className="border rounded-xl overflow-hidden bg-card">
      {market.image && (
        // eslint-disable-next-line @next/next/no-img-element -- Bilder kommen aus dem Event-Speicher, wie in EventCard
        <img src={market.image} alt={market.name} loading="lazy" className="w-full h-44 object-cover" />
      )}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold">
          <Link href={href} className="hover:underline">{market.name}</Link>
        </h3>
        <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{tx(locale, 'card.place')}</dt>
          <dd>{market.venue} · {market.district}</dd>
          <dt className="text-muted-foreground">{tx(locale, 'card.period')}</dt>
          <dd>{market.periodLabel}</dd>
          <dt className="text-muted-foreground">{tx(locale, 'card.hours')}</dt>
          <dd>{market.hoursLines.length > 0 ? market.hoursLines.join(' · ') : tx(locale, 'table.hoursUnknown')}</dd>
          {market.transit && (
            <>
              <dt className="text-muted-foreground">{tx(locale, 'card.transit')}</dt>
              <dd>{market.transit}</dd>
            </>
          )}
        </dl>
        {market.text && <p className="text-sm text-muted-foreground">{market.text}</p>}
        {market.badges.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {market.badges.map(badge => (
              <li key={badge} className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-0.5">{badge}</li>
            ))}
          </ul>
        )}
        <Link href={href} className="inline-block text-sm text-primary hover:underline">
          → {tx(locale, 'card.link')}
        </Link>
      </div>
    </article>
  )
}

export default function WeihnachtsmaerkteWien({ model }: { model: PageModel }) {
  const { locale } = model
  const localePath = useLocalePath()
  const [filter, setFilter] = useState<Filter>('all')

  const filterOptions: { id: Filter; label: string }[] = [
    { id: 'all', label: tx(locale, 'filter.all') },
    ...model.groups.map(g => ({ id: g.id as Filter, label: g.title })),
    ...(model.uncurated.length > 0 ? [{ id: 'more' as Filter, label: tx(locale, 'more.title') }] : []),
  ]
  const visibleMarkets = model.markets.filter(m => matches(m, filter))
  const showGroup = (id: ChristmasGroupId) => filter === 'all' || filter === id
  const showMore = filter === 'all' || filter === 'more'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Kopf */}
      <div className="mb-10">
        <nav aria-label={tx(locale, 'breadcrumb.label')} className="flex items-center gap-2 text-muted-foreground mb-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{tx(locale, 'breadcrumb.country')}</span>
          <span aria-hidden>/</span>
          <Link href={localePath('/events/wien')} className="hover:underline">{tx(locale, 'breadcrumb.city')}</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{tx(locale, 'breadcrumb.page')}</span>
        </nav>
        <h1 className="text-3xl font-bold mb-4">{model.headline}</h1>
        {model.intro.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground text-lg max-w-3xl mb-3">{paragraph}</p>
        ))}
        {model.updated && <p className="text-sm text-muted-foreground italic">{model.updated}</p>}
      </div>

      {/* Filter */}
      {filterOptions.length > 2 && (
        <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label={tx(locale, 'filter.label')}>
          <span className="text-sm text-muted-foreground mr-1">{tx(locale, 'filter.label')}:</span>
          {filterOptions.map(option => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={`text-sm rounded-full border px-3 py-1 transition-colors ${
                filter === option.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {model.count === 0 ? (
        <p className="mb-12 text-muted-foreground">{tx(locale, 'empty')}</p>
      ) : (
        <>
          {/* Übersichtstabelle */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">{tx(locale, 'table.heading')}</h2>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    {(['market', 'districtHeader', 'period', 'hours', 'transit'] as const).map(key => (
                      <th key={key} scope="col" className="px-4 py-3 font-medium">{tx(locale, `table.headers.${key}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleMarkets.map(market => (
                    <tr key={market.id} className="border-t align-top">
                      <td className="px-4 py-3 font-medium">
                        <Link href={localePath(market.path)} className="text-primary hover:underline">{market.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{market.district}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{market.periodLabel}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {market.hoursLines.length > 0
                          ? market.hoursLines.map(line => <div key={line}>{line}</div>)
                          : tx(locale, 'table.hoursUnknown')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{market.transit ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Zeitleiste */}
          {model.timeline && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-2">{tx(locale, 'timeline.heading')}</h2>
              <p className="text-sm text-muted-foreground mb-4">{tx(locale, 'timeline.note')}</p>
              <div className="border rounded-xl p-4">
                <div className="relative h-5 ml-0 sm:ml-56 text-xs text-muted-foreground">
                  {model.timeline.months.map(month => (
                    <span key={month.label} className="absolute" style={{ left: `${month.offsetPct}%` }}>{month.label}</span>
                  ))}
                </div>
                <ul className="space-y-2">
                  {model.timeline.rows
                    .filter(row => filter === 'all' || (filter === 'more' ? row.group === null : row.group === filter))
                    .map(row => (
                      <li key={row.id} className="sm:flex sm:items-center gap-2">
                        <span className="block sm:w-56 sm:shrink-0 text-sm truncate" title={row.name}>{row.name}</span>
                        <div className="relative flex-1 h-6 bg-muted/40 rounded">
                          {model.timeline!.xmasOffsetPct !== null && (
                            <span
                              className="absolute top-0 bottom-0 w-px bg-red-500"
                              style={{ left: `${model.timeline!.xmasOffsetPct}%` }}
                              aria-hidden
                            />
                          )}
                          <span
                            className="absolute top-1 bottom-1 rounded bg-primary/70"
                            style={{ left: `${row.offsetPct}%`, width: `${row.widthPct}%` }}
                            title={row.label}
                          />
                          <span className="sr-only">{row.label}</span>
                        </div>
                      </li>
                    ))}
                </ul>
                {model.timeline.xmasOffsetPct !== null && (
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-3 h-px bg-red-500" aria-hidden /> {tx(locale, 'timeline.xmas')}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Gruppierte Abschnitte */}
          {model.groups.filter(g => showGroup(g.id)).map(group => (
            <section key={group.id} id={group.id} className="mb-12">
              <h2 className="text-xl font-semibold mb-2">{group.title}</h2>
              <p className="text-muted-foreground mb-5">{group.intro}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.markets.map(market => (
                  <MarketCard key={market.id} market={market} href={localePath(market.path)} locale={locale} />
                ))}
              </div>
            </section>
          ))}

          {/* Nicht kuratierte Events — verschwinden nicht, sondern sammeln sich hier */}
          {model.uncurated.length > 0 && showMore && (
            <section id="weitere" className="mb-12">
              <h2 className="text-xl font-semibold mb-2">{tx(locale, 'more.title')}</h2>
              <p className="text-muted-foreground mb-5">{tx(locale, 'more.intro')}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                {model.uncurated.map(market => (
                  <MarketCard key={market.id} market={market} href={localePath(market.path)} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {/* Nach dem 24. Dezember */}
          <section className="mb-12 rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
            <h2 className="text-xl font-semibold mb-3">{tx(locale, 'afterChristmas.heading')}</h2>
            {model.afterXmas.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-4">{tx(locale, 'afterChristmas.intro')}</p>
                <ul className="space-y-2">
                  {model.afterXmas.map(market => (
                    <li key={market.id}>
                      <Link href={localePath(market.path)} className="font-medium text-primary hover:underline">{market.name}</Link>
                      <span className="text-muted-foreground">
                        {' – '}{tx(locale, 'afterChristmas.item', { date: market.lastDayLabel, count: market.daysAfterXmas })}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground">{tx(locale, 'afterChristmas.none')}</p>
            )}
          </section>
        </>
      )}

      {/* Tipps */}
      {model.tips.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">{tx(locale, 'tips.heading')}</h2>
          <ul className="space-y-4">
            {model.tips.map(tip => (
              <li key={tip.title} className="text-muted-foreground">
                <strong className="text-foreground">{tip.title}</strong> {tip.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ — <details>, damit die Antworten im Quelltext stehen */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">{tx(locale, 'faq.heading')}</h2>
        <div className="space-y-3">
          {model.faqs.map(faq => (
            <details key={faq.q} className="border rounded-xl px-5 py-4 group">
              <summary className="font-medium cursor-pointer list-none flex justify-between gap-4">
                <span>{faq.q}</span>
                <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Abschluss */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">{tx(locale, 'outro.heading')}</h2>
        <p className="text-muted-foreground mb-3">
          {tx(locale, 'outro.appText')}{' '}
          <a href={APP_STORE_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">App Store</a>
          {' · '}
          <a href={PLAY_STORE_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Play</a>
        </p>
        <p className="text-muted-foreground">
          {tx(locale, 'outro.organizerText')}{' '}
          <Link href={localePath('/veranstalter')} className="text-primary hover:underline">{tx(locale, 'outro.organizerLink')}</Link>
        </p>
      </section>
    </div>
  )
}
